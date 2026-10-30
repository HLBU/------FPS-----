const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export function validDescription(s,type){return s&&s.type===type&&typeof s.sdp==='string'&&s.sdp.length>20&&s.sdp.length<60000;}
export async function roomRequest(request,env,ctx){
 const url=new URL(request.url),path=url.pathname.slice('/api/rooms'.length),now=Date.now();
 if(request.method==='POST'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'不允许跨站请求'},403);
 const db=env.DB,mem=env.MEMORY;
 if(!db&&!mem)return json({error:'房间服务尚未配置，可先体验人机模式。'},503);
 let body={};if(request.method==='POST'){if(Number(request.headers.get('content-length'))>65000)return json({error:'请求过大'},413);const text=await request.text();if(text.length>65000)return json({error:'请求过大'},413);try{body=JSON.parse(text);}catch{return json({error:'请求格式错误'},400);}}
 if(path===''&&request.method==='POST'){
  if(!validDescription(body.offer,'offer'))return json({error:'无效的连接邀请'},400);
  const bytes=crypto.getRandomValues(new Uint8Array(6)),code=[...bytes].map(b=>alphabet[b%alphabet.length]).join(''),token=crypto.randomUUID(),record={code,token,offer:JSON.stringify(body.offer),answer:null,expires:now+600000};
  if(mem){for(const [k,v]of mem)if(v.expires<now)mem.delete(k);if(mem.has(code))return json({error:'房间码冲突，请重试'},409);mem.set(code,record);}
  else{try{await db.prepare('INSERT INTO rooms (code, token, offer, answer, expires) VALUES (?, ?, ?, NULL, ?)').bind(code,token,record.offer,record.expires).run();}catch{return json({error:'创建房间失败，请稍后重试'},503);}ctx?.waitUntil(db.prepare('DELETE FROM rooms WHERE expires < ?').bind(now).run());}
  return json({code,token});
 }
 const match=path.match(/^\/([A-Z2-9]{6})(\/answer)?$/);if(!match)return json({error:'房间地址无效'},404);const code=match[1];const record=mem?mem.get(code):await db.prepare('SELECT * FROM rooms WHERE code = ?').bind(code).first();
 if(!record||record.expires<now)return json({error:'房间不存在或已过期，请让朋友重新创建。'},404);
 if(request.method==='GET'&&!match[2]){if(url.searchParams.get('token')===record.token)return json({answer:record.answer?JSON.parse(record.answer):null});return json({offer:JSON.parse(record.offer)});}
 if(request.method==='POST'&&match[2]){if(!validDescription(body.answer,'answer'))return json({error:'无效的连接响应'},400);if(mem){if(record.answer)return json({error:'房间已经有人加入'},409);record.answer=JSON.stringify(body.answer);}else{const r=await db.prepare('UPDATE rooms SET answer = ? WHERE code = ? AND answer IS NULL AND expires > ?').bind(JSON.stringify(body.answer),code,now).run();if(!r.meta.changes)return json({error:'房间已经有人加入'},409);}return json({ok:true});}
 return json({error:'不支持的请求'},405);
}
