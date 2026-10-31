export class ServerConnection{
 constructor(onData,onStatus){this.onData=onData;this.onStatus=onStatus;this.authoritative=true;this.pending=new Map();this.seq=0;this.closed=false;}
 async open(){if(this.ws?.readyState===1)return;const url=new URL('arena',location.href);url.search='';url.protocol=location.protocol==='https:'?'wss:':'ws:';const ws=this.ws=new WebSocket(url);
  ws.onmessage=e=>{let m;try{m=JSON.parse(e.data);}catch{return;}if(m.id){const p=this.pending.get(m.id);if(p){this.pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error)):p.resolve(m);}}else if(m.type==='connected')this.onStatus('connected');else if(m.type==='left')this.onStatus('对方已离开房间，请重新建立房间。');else this.onData(m);};
  ws.onclose=()=>{for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('服务器连接已断开'));}this.pending.clear();if(!this.closed)this.onStatus('连接中断，请返回后重新建立房间。');};
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(Error('连接服务器超时'));},12000);ws.onopen=()=>{clearTimeout(timer);resolve();};ws.onerror=()=>{clearTimeout(timer);reject(Error('无法连接房间服务器'));};});
 }
 async request(type,extra={}){await this.open();if(this.closed)return;const id=++this.seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('房间请求超时'));},10000);this.pending.set(id,{resolve,reject,timer});this.ws.send(JSON.stringify({type,id,...extra}));});}
 async host(){return (await this.request('host'))?.code;}
 async join(code){await this.request('join',{code});}
 send(m){if(this.ws?.readyState===1&&this.ws.bufferedAmount<65536)this.ws.send(JSON.stringify(m));}
 close(){this.closed=true;this.ws?.close();}
}
