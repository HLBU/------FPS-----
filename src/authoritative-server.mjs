import {randomBytes} from 'node:crypto';
import {WebSocketServer} from 'ws';
import {Game,CFG} from './game.js';

const STEP=1/60;
export function attachGameServer(server,{path='/relay',authorize=()=>true}={}){
 const rooms=new Map(),wss=new WebSocketServer({noServer:true,maxPayload:16384,perMessageDeflate:false});
 const send=(ws,data)=>{if(ws?.readyState===1){if(ws.bufferedAmount>262144){ws.close(1013);return;}ws.send(JSON.stringify(data));}};
 const publish=room=>{for(let id=0;id<2;id++)send(room.peers[id],{type:'state',state:{...room.game.snapshot(id),serverTime:room.time,ack:room.acks[id],roundKey:room.epoch}});};
 server.on('upgrade',(req,socket,head)=>{let url;try{url=new URL(req.url,'http://'+req.headers.host);}catch{socket.destroy();return;}if(url.pathname!==path)return;
  if(!authorize(req,url)){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
 });
 wss.on('connection',ws=>{
  ws.alive=true;ws.rtt=0;ws.on('pong',()=>{ws.alive=true;ws.rtt=Math.min(.3,(performance.now()-(ws.pingAt||performance.now()))/1000);});
  ws.on('message',raw=>{try{const m=JSON.parse(raw);if(!m||typeof m!=='object')return;
   const now=performance.now();if(now-(ws.windowAt||0)>1000){ws.windowAt=now;ws.count=0;}if((ws.count=(ws.count||0)+1)>150){ws.close(1008);return;}
   if(m.type==='host'||m.type==='join'){
    if(ws.room){send(ws,{id:m.id,error:'已经加入房间'});return;}
    if(m.type==='host'){
     if(rooms.size>=100){send(ws,{id:m.id,error:'房间已满，请稍后再试'});return;}const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let code;do{code=[...randomBytes(6)].map(x=>alphabet[x%alphabet.length]).join('');}while(rooms.has(code));
     ws.room={code,peers:[ws,null],game:new Game(),queues:[[],[]],acks:[0,0],lastSeq:[0,0],time:0,epoch:0,history:[],created:Date.now(),nextReady:[false,false]};ws.playerId=0;rooms.set(code,ws.room);send(ws,{id:m.id,code});
    }else{const room=rooms.get(m.code);if(!room||room.peers[1]){send(ws,{id:m.id,error:'房间不存在或已经有人加入'});return;}ws.room=room;ws.playerId=1;room.peers[1]=ws;send(ws,{id:m.id});for(const peer of room.peers)send(peer,{type:'connected'});publish(room);}return;
   }
   const room=ws.room;if(!room?.peers[1])return;const id=ws.playerId;
   if(m.type==='input'&&Number.isSafeInteger(m.seq)&&m.seq>room.lastSeq[id]&&m.roundKey===room.epoch){
    room.lastSeq[id]=m.seq;const queue=room.queues[id];queue.push({seq:m.seq,input:m.input||{},viewTime:Number(m.viewTime)});if(queue.length>8)queue.splice(0,queue.length-8);ws.lastInput=now;
   }else if(m.type==='choose'){room.game.choose(id,m.ids);publish(room);}
   else if(m.type==='next'&&['result','over'].includes(room.game.stage)){
    room.nextReady[id]=true;for(const peer of room.peers)send(peer,{type:'nextReady',ready:room.nextReady});if(room.nextReady.every(Boolean)){room.game.next();room.epoch++;room.queues=[[],[]];room.history=[];room.nextReady=[false,false];publish(room);}
   }
  }catch{ws.close(1007);}});
  ws.on('error',()=>{});ws.on('close',()=>{const room=ws.room;if(room){rooms.delete(room.code);for(const peer of room.peers)if(peer!==ws){send(peer,{type:'left'});peer?.close();}}});
 });
 function tick(room){if(!room.peers[1])return;room.time+=STEP;const game=room.game;
  for(let id=0;id<2;id++){const cmd=room.queues[id].shift(),peer=room.peers[id];if(cmd){game.input(id,cmd.input);room.acks[id]=cmd.seq;const age=Math.max(0,Math.min(CFG.lagCompensation,peer.rtt/2+.1,room.time-cmd.viewTime));game.players[id].rewindAge=Number.isFinite(age)?age:0;}else if(performance.now()-(peer.lastInput||0)>250)game.input(id,{yaw:game.players[id].yaw,pitch:game.players[id].pitch});}
  game.rewindTarget=(id,age)=>{if(game.stage!=='fight'||!age)return game.players[id];const time=room.time-age;let sample=room.history[0];for(const entry of room.history){if(entry.time<=time)sample=entry;else break;}return sample?.players[id]||game.players[id];};
  game.tick(STEP);if(game.stage==='fight'){room.history.push({time:room.time,players:game.players.map(p=>structuredClone(p))});while(room.history.length>20)room.history.shift();}else room.history=[];
  if((room.frame=(room.frame||0)+1)%3===0)publish(room);
 }
 let previous=performance.now(),acc=0;
 const timer=setInterval(()=>{const now=performance.now();acc+=Math.min(.25,(now-previous)/1000);previous=now;let steps=0;while(acc>=STEP&&steps++<15){for(const room of rooms.values())tick(room);acc-=STEP;}},1000/120);timer.unref();
 const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.pingAt=performance.now();ws.ping();}for(const room of rooms.values())if(!room.peers[1]&&Date.now()-room.created>600000)room.peers[0].close();},3000);heartbeat.unref();
 const close=()=>{clearInterval(timer);clearInterval(heartbeat);for(const ws of wss.clients)ws.terminate();wss.close();};server.on('close',close);
 return {rooms,wss,close,tick};
}
