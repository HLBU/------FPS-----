import http from 'node:http';
import {attachGameServer} from '../src/authoritative-server.mjs';
import {createHmac,randomBytes,timingSafeEqual,webcrypto} from 'node:crypto';
import {WebSocketServer} from 'ws';
import worker from '../dist/server/index.js';
globalThis.crypto ??= webcrypto;
const base=process.env.GAME_BASE_PATH||'/fps/v20261031/';
const code=process.env.GAME_TEST_CODE;
if(!code||!/^\/[a-zA-Z0-9/_-]+\/$/.test(base))throw Error('Invalid deployment configuration');
const secret=process.env.GAME_SESSION_SECRET||randomBytes(32).toString('hex');
const cookie='fps2_session';
const sign=x=>createHmac('sha256',secret).update(x).digest('hex');
function authorized(req,url){
 if(url.searchParams.has('code'))return url.searchParams.get('code')===code;
 const value=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1)||'';
 const [expiry,sig]=value.split('.');return /^\d+$/.test(expiry||'')&&Number(expiry)>Date.now()&&/^[a-f0-9]{64}$/.test(sig||'')&&timingSafeEqual(Buffer.from(sig),Buffer.from(sign(expiry)));
}
const env={MEMORY:new Map()},rooms=new Map();
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const url=new URL(req.url,'http://'+req.headers.host);
  if(!url.pathname.startsWith(base)){res.writeHead(404);res.end();return;}
  if(!authorized(req,url)){res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8'});res.end('请使用带有正确测试码的完整链接访问游戏。');return;}
  if(url.searchParams.get('code')===code){const expiry=String(Date.now()+8*3600000);res.setHeader('Set-Cookie',`${cookie}=${expiry}.${sign(expiry)}; Path=${base}; HttpOnly; SameSite=Lax; Max-Age=28800`);}
  url.pathname='/'+url.pathname.slice(base.length);url.searchParams.delete('code');
  const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>65000){res.writeHead(413);res.end();return;}chunks.push(c);}
  const response=await worker.fetch(new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),env,{waitUntil:p=>p.catch(console.error)});
  let body=Buffer.from(await response.arrayBuffer());
  if(response.headers.get('content-type')?.includes('text/html'))body=Buffer.from(body.toString().replaceAll('href="/','href="'+base).replaceAll('src="/','src="'+base).replace('</head>',`<script>globalThis.FPS_RELAY=true;globalThis.FPS_AUTH=true;globalThis.FPS_TEST_CODE=${JSON.stringify(code).replaceAll('<','\\u003c')};</script></head>`));
  for(const [k,v]of response.headers)if(!['cache-control','referrer-policy'].includes(k))res.setHeader(k,v);
  res.writeHead(response.status);res.end(req.method==='HEAD'?undefined:body);
 }catch(error){console.error(error);res.writeHead(500);res.end('Request failed');}
});
const wss=new WebSocketServer({noServer:true,maxPayload:131072,perMessageDeflate:false});
attachGameServer(server,{path:base+'arena',authorize:(req,url)=>authorized(req,url)&&['http://'+req.headers.host,'https://'+req.headers.host].includes(req.headers.origin)});
server.on('upgrade',(req,socket,head)=>{const url=new URL(req.url,'http://'+req.headers.host);if(url.pathname===base+'arena')return;if(url.pathname!==base+'relay'||!authorized(req,url)||req.headers.origin!=='http://'+req.headers.host){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));});
const send=(ws,m)=>{if(ws?.readyState===1){if(ws.bufferedAmount>1048576){ws.close(1013);return;}ws.send(JSON.stringify(m));}};
wss.on('connection',ws=>{
 ws.alive=true;ws.on('pong',()=>ws.alive=true);
 ws.on('message',raw=>{try{const m=JSON.parse(raw);if(m.type==='data'){if(ws.room?.guest)send(ws===ws.room.host?ws.room.guest:ws.room.host,{type:'data',data:m.data});return;}
  if(ws.room){send(ws,{id:m.id,error:'已经加入房间'});return;}
  if(m.type==='host'){
   if(rooms.size>=200){send(ws,{id:m.id,error:'房间已满，请稍后再试'});return;}
   const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let roomCode;do{roomCode=[...randomBytes(6)].map(x=>alphabet[x%alphabet.length]).join('');}while(rooms.has(roomCode));
   ws.room={code:roomCode,host:ws,guest:null,created:Date.now()};rooms.set(roomCode,ws.room);send(ws,{id:m.id,code:roomCode});
  }else if(m.type==='join'){
   const room=rooms.get(m.code);if(!room||room.guest){send(ws,{id:m.id,error:'房间不存在或已经有人加入'});return;}
   ws.room=room;room.guest=ws;send(ws,{id:m.id});send(room.host,{type:'connected'});send(ws,{type:'connected'});
  }
 }catch{ws.close(1007);}});
 ws.on('error',()=>{});
 ws.on('close',()=>{const room=ws.room;if(room){rooms.delete(room.code);const peer=ws===room.host?room.guest:room.host;send(peer,{type:'left'});peer?.close();}});
});
setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}for(const room of rooms.values())if(!room.guest&&Date.now()-room.created>600000)room.host.close();},30000).unref();
server.listen(Number(process.env.PORT||5189),'127.0.0.1',()=>console.log('Aliyun FPS ready at '+base));
