import {Game,CFG} from './game.js';
export const STEP=1/60;
const copy=p=>structuredClone(p);
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export const shoulderFov=(fov,magnification=CFG.aimZoom)=>2*Math.atan(Math.tan(fov*Math.PI/360)/magnification)*180/Math.PI;
// Only movement is predicted. Damage, ammo, cooldown acceptance and outcomes stay authoritative.
export class ClientSync{
 constructor(){this.sim=new Game();this.reset();}
 reset(){this.seq=0;this.pending=[];this.snapshots=[];this.predicted=null;this.key=null;this.latest=null;this.elapsed=0;this.offset=[0,0,0];}
 accept(state,id){const changed=this.key!==state.roundKey||this.latest?.stage!==state.stage;
  if(changed){this.pending=[];this.snapshots=[];this.offset=[0,0,0];}const before=this.predicted;this.key=state.roundKey;this.latest=state;this.elapsed=0;
  this.pending=this.pending.filter(c=>c.seq>state.ack);this.predicted=copy(state.players[id]);for(const c of this.pending)this.predict(c.input);
  if(!changed&&before){this.offset=['x','y','z'].map((k,i)=>this.offset[i]+before[k]-this.predicted[k]);if(Math.hypot(...this.offset)>1)this.offset=[0,0,0];}
  this.snapshots.push(copy(state));this.snapshots=this.snapshots.slice(-12);
 }
 predict(input){const p=this.predicted;if(!p||this.latest.stage!=='fight')return;this.sim.input(0,input);p.input=this.sim.players[0].input;this.sim.move(p,STEP);this.sim.events=[];}
 command(input){const cmd={type:'input',seq:++this.seq,roundKey:this.key,input:{...input},viewTime:(this.latest?.serverTime||0)+this.elapsed-.1};this.pending.push(cmd);if(this.pending.length>60)this.pending.shift();this.predict(input);return cmd;}
 view(id,dt){if(!this.latest)return null;this.elapsed+=dt;const result={...this.latest,players:this.latest.players.map(copy)},p=this.predicted;
  if(p&&this.latest.stage==='fight'){for(const k of ['x','y','z','vx','vy','vz','yaw','pitch','lean','stance','poseFrom','poseBlend','grounded','walkPhase','sprinting','aiming','dash','dashX','dashZ'])result.players[id][k]=copy(p[k]);for(let i=0;i<3;i++){this.offset[i]*=Math.exp(-dt*18);result.players[id][['x','y','z'][i]]+=this.offset[i];}}
  const target=this.latest.serverTime+Math.min(this.elapsed,.1)-.1,other=1-id;let a=this.snapshots[0],b=this.snapshots.at(-1);for(const s of this.snapshots){if(s.serverTime<=target)a=s;if(s.serverTime>=target){b=s;break;}}if(a&&b&&a.stage===b.stage){const t=Math.max(0,Math.min(1,(target-a.serverTime)/Math.max(.0001,b.serverTime-a.serverTime))),q=result.players[other];for(const k of ['x','y','z','lean','walkPhase'])q[k]=a.players[other][k]+(b.players[other][k]-a.players[other][k])*t;q.yaw=angle(a.players[other].yaw,b.players[other].yaw,t);}
  return result;
 }
}
export class DashConfirmation{
 constructor(){this.pending=new Map();this.played=new Set();}
 predict(seq,now){this.pending.set(seq,now);this.played.add(seq);}
 confirm(e){if(!this.played.has(e.seq))return false;this.pending.delete(e.seq);return true;}
 expired(now){let rejected=false;for(const [seq,time]of this.pending)if(now-time>.6){this.pending.delete(seq);rejected=true;}return rejected;}
 clear(){this.pending.clear();this.played.clear();}
}
