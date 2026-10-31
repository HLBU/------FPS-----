// Alibaba deployments relay the same host-authoritative messages over WebSocket.
export class RelayConnection {
 constructor(onData,onStatus){this.onData=onData;this.onStatus=onStatus;this.pending=new Map();this.seq=0;this.closed=false;}
 async open(){
  const url=new URL('relay',location.href);url.search='';url.protocol=location.protocol==='https:'?'wss:':'ws:';
  const ws=this.ws=new WebSocket(url);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error)):p.resolve(m);}}else if(m.type==='data')this.onData(m.data);else if(m.type==='connected')this.onStatus('connected');else if(m.type==='left')this.onStatus('对方已离开房间，请重新建立房间。');};
  ws.onclose=()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('服务器连接已断开'));}this.pending.clear();if(!this.closed)this.onStatus('连接中断，请返回后重新建立房间。');};
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(new Error('连接服务器超时'));},12000);ws.onopen=()=>{clearTimeout(timer);resolve();};ws.onerror=()=>{clearTimeout(timer);reject(new Error('无法连接房间服务器'));};});
 }
 async request(type,extra={}){await this.open();if(this.closed){this.ws.close();return;}const id=++this.seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('房间请求超时'));},10000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({id,type,...extra}));});}
 async host(){const r=await this.request('host');return r?.code;}
 async join(code){await this.request('join',{code});}
 send(data){if(this.ws?.readyState===WebSocket.OPEN&&this.ws.bufferedAmount<150000)this.ws.send(JSON.stringify({type:'data',data}));}
 close(){this.closed=true;this.ws?.close();}
}
