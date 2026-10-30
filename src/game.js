// Shared authoritative rules: browser bot match and WebRTC host run this same world.
import balance from './generated-balance.js';
import {BASE_PARTS,poseParts,eyeLocal,bodyShape,leanPoint,stanceName} from './pose.js';
export {poseParts,bodyShape,leanPoint,stanceName};
export const CFG=balance;
export const CHEATS = [
  {id:'esp',name:'透视',en:'WALL VISION',icon:'◉',desc:'持续看见敌人位置和轮廓。'},
  {id:'aim',name:'自瞄',en:'LIMB LOCK',icon:'⌖',desc:'开火锁定视线内的四肢；无四肢则锁躯干。大幅低头时优先射地起飞。'},
  {id:'wall',name:'子弹穿墙',en:'WALLBREAKER',icon:'↗',desc:'穿透所有墙体，伤害不衰减。不能隔墙自动锁定。'},
  {id:'silent',name:'没有脚步',en:'GHOST STEP',icon:'∅',desc:'移动与落地无声，开枪仍会暴露你。'},
  {id:'third',name:'第三人称',en:'OUT OF BODY',icon:'◈',desc:'切换第三人称，从掩体旁观察战场。'},
  {id:'speed',name:'超级移速',en:'OVERDRIVE',icon:'»',desc:`正常走路不加速；按住 Shift 冲刺时为基础速度 ×${CFG.speedMultiplier}，不叠乘普通冲刺。`},
  {id:'limbless',name:'没有四肢',en:'LIMBS OFF',icon:'✂',desc:'四肢消失且免伤，只剩头与躯干可被攻击。'},
  {id:'infinite',name:'无限子弹',en:'BOTTOMLESS',icon:'∞',desc:'弹匣不消耗，无需换弹。持续射地可维持升力。'},
  {id:'regen',name:'自动回血',en:'SELF REPAIR',icon:'+',desc:`持续每秒恢复 ${CFG.regen} 点生命，挨打也不停止。`},
  {id:'small',name:'人物缩小',en:'FUN SIZE',icon:'◇',desc:`身体与命中区域缩小至 ${Math.round(CFG.smallScale*100)}%，视点随之降低。`}
];
// [x, bottom, z, width, height, depth, kind]. Every solid is penetrable with WALLBREAKER.
export const BLOCKS=[
 [0,-.7,0,32,.7,40,'floor'],[-16,0,0,1,7,41,'boundary'],[16,0,0,1,7,41,'boundary'],[0,0,-20,33,7,1,'boundary'],[0,0,20,33,7,1,'boundary'],
 [-5,0,-12,10,4,.65,'wall'],[5,0,12,10,4,.65,'wall'],
 [-9,0,0,.7,4,15,'wall'],[9,0,0,.7,4,15,'wall'],
 [-3,0,-4,5,1.35,1.3,'cover'],[3,0,4,5,1.35,1.3,'cover'],
 [3,.7,-5,4,1.7,.65,'leg'],[-3,.7,5,4,1.7,.65,'leg'],
 [0,0,0,2,2.5,2,'core'],[-12,0,-9,2.6,1.15,3,'cover'],[12,0,9,2.6,1.15,3,'cover'],
 [-12,0,8,2.6,1.15,3,'cover'],[12,0,-8,2.6,1.15,3,'cover'],
 [-4,0,13,2.5,.8,2.5,'cover'],[4,0,-13,2.5,.8,2.5,'cover']
];
export const has=(p,id)=>p.cheats.includes(id);
export const scale=p=>has(p,'small')?CFG.smallScale:1;
function toWorld(p,point){const s=scale(p),c=Math.cos(p.yaw),n=Math.sin(p.yaw);return [p.x+(point[0]*c+point[2]*n)*s,p.y+point[1]*s,p.z+(-point[0]*n+point[2]*c)*s];}
export const eye=p=>toWorld(p,eyeLocal(p));
export const direction=(yaw,pitch)=>[-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
export function cameraPoint(p,yaw=p.yaw,pitch=p.pitch){const e=eye(p);if(!has(p,'third'))return e;const d=direction(yaw,pitch),boom=p.aiming?1.65:2.8,side=p.aiming?.48:.65,v=[-d[0]*boom+Math.cos(yaw)*side,.45-d[1]*boom,-d[2]*boom-Math.sin(yaw)*side],len=Math.hypot(...v),n=v.map(a=>a/len),dist=Math.max(0,Math.min(len,wallDistance(e,n)-.18));return e.map((a,i)=>a+n[i]*dist);}
export function aimAngles(a,b){const x=b[0]-a[0],y=b[1]-a[1],z=b[2]-a[2];return {yaw:Math.atan2(-x,-z),pitch:Math.atan2(y,Math.hypot(x,z))};}
export function rayBox(o,d,min,max){let lo=0,hi=150;for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-8){if(o[i]<min[i]||o[i]>max[i])return Infinity;}else{let a=(min[i]-o[i])/d[i],b=(max[i]-o[i])/d[i];if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return Infinity;}}return lo;}
export function wallDistance(o,d){let t=Infinity;for(const [x,y,z,w,h,l] of BLOCKS)t=Math.min(t,rayBox(o,d,[x-w/2,y,z-l/2],[x+w/2,y+h,z+l/2]));return t;}
export const PARTS=BASE_PARTS;
export function partCenter(p,part){const index=PARTS.indexOf(part);return toWorld(p,index<0?part.c:poseParts(p)[index].c);}
export function hitPlayer(o,d,p){const s=scale(p),c=Math.cos(p.yaw),n=Math.sin(p.yaw),dx=o[0]-p.x,dz=o[2]-p.z;
 const ro=[(dx*c-dz*n)/s,(o[1]-p.y)/s,(dx*n+dz*c)/s],rd=[(d[0]*c-d[2]*n)/s,d[1]/s,(d[0]*n+d[2]*c)/s];let hit={t:Infinity,part:null};
 for(const part of poseParts(p)){if(part.id==='limb'&&has(p,'limbless'))continue;const co=Math.cos(part.rz),si=Math.sin(part.rz),cx=Math.cos(part.rx),sx=Math.sin(part.rx),v=ro.map((x,i)=>x-part.c[i]);
  const rotate=([x,y,z])=>{const a=x*co+y*si,b=-x*si+y*co;return[a,b*cx+z*sx,-b*sx+z*cx];};
  const t=rayBox(rotate(v),rotate(rd),part.size.map(x=>-x/2),part.size.map(x=>x/2));if(t<hit.t)hit={t,part:part.id};}return hit;}
export function lockTarget(p,q){const o=eye(p);for(const part of [...PARTS.filter(a=>a.id==='limb'),PARTS[1],PARTS[0]]){if(part.id==='limb'&&has(q,'limbless'))continue;const target=partCenter(q,part),v=target.map((a,i)=>a-o[i]),l=Math.hypot(...v);if(wallDistance(o,v.map(a=>a/l))>l-.08)return target;}return null;}
export const spreadFor=p=>(!p.grounded?CFG.spread.air:Math.hypot(p.vx,p.vz)>1?CFG.spread.move:CFG.spread.stand)*(p.aiming?CFG.aimSpread:1);
const emptyInput=()=>({forward:0,strafe:0,lean:0,crouch:false,prone:false,sprint:false,jump:false,fire:false,reload:false,aim:false,dashSeq:0,yaw:0,pitch:0});
function player(id){return {id,x:0,y:0,z:0,yaw:0,pitch:0,lean:0,vx:0,vy:0,vz:0,hp:CFG.hp,ammo:CFG.mag,reload:0,cool:0,cheats:[],grounded:true,input:emptyInput(),foot:0,footDistance:0,walkPhase:0,stance:0,sprinting:false,shotAnim:0,hitAnim:0,reloadDuration:0,dead:false,aiming:false,dash:0,dashCooldown:0,lastDashSeq:0,dashX:0,dashZ:0};}
function shuffle(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const walkable=(x,z)=>Math.abs(x)<15&&Math.abs(z)<19&&!BLOCKS.some(([bx,y,bz,w,h,d,kind])=>kind!=='floor'&&y<1.8&&y+h>.1&&Math.abs(x-bx)<w/2+.34&&Math.abs(z-bz)<d/2+.34);
// Small, deterministic navigation grid. Bots cannot see a target merely because a path exists.
export function findPath(from,to){const start=[Math.round(from[0]),Math.round(from[1])],goal=[Math.round(to[0]),Math.round(to[1])],key=(x,z)=>`${x},${z}`;const queue=[start],seen=new Map([[key(...start),null]]);let best=start,bestD=Infinity;
 for(let i=0;i<queue.length;i++){const n=queue[i],dist=(n[0]-goal[0])**2+(n[1]-goal[1])**2;if(dist<bestD){best=n;bestD=dist;}if(dist===0)break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n[0]+dx,z=n[1]+dz,k=key(x,z);if(!seen.has(k)&&walkable(x,z)){seen.set(k,n);queue.push([x,z]);}}}
 const result=[];let n=best;while(n){result.unshift(n);n=seen.get(key(...n));}return result.slice(1);
}
export class Game{
 constructor({bot=false,rng=Math.random}={}){this.rng=rng;this.bot=bot;this.players=[player(0),player(1)];this.score=[0,0];this.round=0;this.time=0;this.events=[];this.eid=0;this.stage='select';this.ready=[false,false];this.botState={reaction:0,next:0,waypoint:0};this.newRound();}
 emit(type,data={}){this.events.push({id:++this.eid,type,...data});this.events=this.events.slice(-70);}
 newRound(){this.round++;this.prepare=0;this.botState={reaction:0,next:0,waypoint:0};this.time=CFG.roundTime;this.stage='select';this.ready=[false,false];this.winner=null;this.reason='';this.offers=shuffle(CHEATS.map(a=>a.id),this.rng).slice(0,3);this.players=[player(0),player(1)];for(let i=0;i<2;i++){this.players[i].x=i?5:-5;this.players[i].z=i?-16:16;this.players[i].yaw=i?Math.PI:0;}if(this.bot)this.choose(1,shuffle(this.offers,this.rng).slice(0,2));}
 choose(id,ids){if(this.stage!=='select'||!Array.isArray(ids)||ids.length!==2||new Set(ids).size!==2||!ids.every(a=>this.offers.includes(a)))return false;this.players[id].cheats=[...ids];this.ready[id]=true;if(this.ready.every(Boolean)){this.stage='prepare';this.prepare=CFG.prepareTime;this.emit('prepare',{round:this.round});}return true;}
 input(id,data){if(!this.players[id]||!data)return;const p=this.players[id];p.input={forward:Math.max(-1,Math.min(1,Number(data.forward)||0)),strafe:Math.max(-1,Math.min(1,Number(data.strafe)||0)),lean:Math.max(-1,Math.min(1,Number(data.lean)||0)),crouch:!!data.crouch,prone:!!data.prone,sprint:!!data.sprint,jump:!!data.jump,fire:!!data.fire,reload:!!data.reload,aim:!!data.aim,dashSeq:Number.isSafeInteger(data.dashSeq)&&data.dashSeq>=0?data.dashSeq:0,yaw:Number.isFinite(data.yaw)?data.yaw:0,pitch:Math.max(-1.53,Math.min(1.53,Number(data.pitch)||0))};}
 snapshot(){return {players:this.players.map(({input,...p})=>({...p,cheats:this.stage==='select'?[]:p.cheats})),score:this.score,round:this.round,time:this.time,prepare:this.prepare||0,stage:this.stage,ready:this.ready,offers:this.offers,winner:this.winner,reason:this.reason,events:this.events};}
 next(){if(this.stage==='result')this.newRound();else if(this.stage==='over'){this.score=[0,0];this.round=0;this.newRound();}}
 tick(dt){dt=Math.max(0,Math.min(.05,dt));if(this.stage==='prepare'){this.prepare=Math.max(0,this.prepare-dt);if(this.prepare<1e-8){this.prepare=0;this.stage='fight';for(const p of this.players)p.input=emptyInput();this.emit('start',{round:this.round});}return;}if(this.stage!=='fight')return;this.time=Math.max(0,this.time-dt);if(this.bot)this.botTick(dt);
  for(const p of this.players){if(this.stage!=='fight')break;this.move(p,dt);p.cool=Math.max(0,p.cool-dt);p.shotAnim=Math.max(0,p.shotAnim-dt);p.hitAnim=Math.max(0,p.hitAnim-dt);if(p.reload>0){p.reload=Math.max(0,p.reload-dt);if(p.reload===0){p.ammo=CFG.mag;this.emit('loaded',{who:p.id});}}
   if(has(p,'regen'))p.hp=Math.min(CFG.hp,p.hp+CFG.regen*dt);
   if(p.input.reload&&!p.reload&&p.ammo<CFG.mag&&!has(p,'infinite')){p.reload=p.ammo===0?CFG.reloadEmpty:CFG.reloadPartial;p.reloadDuration=p.reload;this.emit('reload',{who:p.id,empty:p.ammo===0});}
   if(p.input.fire&&!p.dashingThisTick&&!p.reload&&p.cool===0&&p.ammo>0)this.shoot(p);
  }
  if(this.stage==='fight'&&this.time===0){const [a,b]=this.players;if(Math.abs(a.hp-b.hp)<.01)this.finish(null,'生命相同 · 本回合重赛');else this.finish(a.hp>b.hp?0:1,'时间到 · 剩余生命判胜');}
 }
 finish(winner,reason){this.winner=winner;this.reason=reason;if(winner!==null)this.score[winner]++;else this.round--;this.stage=this.score.some(s=>s>=CFG.winsToWin)?'over':'result';if(winner!==null)this.players[1-winner].dead=true;this.emit('end',{winner,reason,score:[...this.score],match:this.stage==='over'});for(const p of this.players)p.input=emptyInput();}
 canOccupy(p,stance){const shape=bodyShape(p,stance),c=Math.abs(Math.cos(p.yaw)),n=Math.abs(Math.sin(p.yaw)),rx=c*shape.rx+n*shape.rz,rz=n*shape.rx+c*shape.rz;
  return !BLOCKS.some(([x,y,z,w,h,l])=>y+h>p.y+.04&&y<p.y+shape.height-.02&&Math.abs(p.x-x)<w/2+rx-.01&&Math.abs(p.z-z)<l/2+rz-.01);}
 move(p,dt){const i=p.input;p.yaw=i.yaw;p.pitch=i.pitch;const wasGrounded=p.grounded,oldX=p.x,oldZ=p.z;
  const wanted=p.dash>0?0:i.prone?2:i.crouch?1:0;if(wanted!==p.stance&&this.canOccupy(p,wanted))p.stance=wanted;
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  if(i.dashSeq!==p.lastDashSeq){p.lastDashSeq=i.dashSeq;if(i.dashSeq>0&&p.dashCooldown===0&&(p.stance===0||this.canOccupy(p,0))){p.stance=0;const len=Math.hypot(i.forward,i.strafe),f=len?i.forward/len:1,r=len?i.strafe/len:0;p.dashX=-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r;p.dashZ=-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r;p.dash=CFG.dashDuration;p.dashCooldown=CFG.dashCooldown;this.emit('dash',{who:p.id,from:[p.x,p.y+.6,p.z]});}}
  const dashStep=Math.min(dt,p.dash);p.dashingThisTick=dashStep>0;p.aiming=!!i.aim&&!p.dash;
  p.sprinting=!p.aiming&&!p.dash&&!!i.sprint&&p.stance===0&&Math.hypot(i.forward,i.strafe)>0;
  const modifier=p.stance===2?CFG.proneSpeed:p.stance===1?CFG.crouchSpeed:p.sprinting?(has(p,'speed')?CFG.speedMultiplier:CFG.sprintMultiplier):1;
  const speed=CFG.speed*modifier*(p.aiming?CFG.aimSpeed:1),len=Math.max(1,Math.hypot(i.forward,i.strafe));
  const targetX=(-Math.sin(p.yaw)*i.forward+Math.cos(p.yaw)*i.strafe)/len*speed,targetZ=(-Math.cos(p.yaw)*i.forward-Math.sin(p.yaw)*i.strafe)/len*speed;
  const rate=!p.grounded?CFG.airAcceleration*(p.aiming?CFG.aimAir:1):Math.hypot(i.forward,i.strafe)>0?CFG.acceleration:CFG.deceleration,dv=Math.hypot(targetX-p.vx,targetZ-p.vz),blend=dv>0?Math.min(1,rate*dt/dv):1;
  if(p.dash){p.vx=p.dashX*CFG.dashDistance/CFG.dashDuration;p.vz=p.dashZ*CFG.dashDistance/CFG.dashDuration;}else{p.vx+=(targetX-p.vx)*blend;p.vz+=(targetZ-p.vz)*blend;}
  if(i.jump&&!p.dash&&p.grounded&&p.stance===0){p.vy=CFG.jumpVelocity*(p.aiming?CFG.aimJump:1);p.grounded=false;}p.vy=Math.max(-CFG.maxFallSpeed,p.vy-CFG.gravity*dt);
  const shape=bodyShape(p),s=scale(p),c=Math.abs(Math.cos(p.yaw)),n=Math.abs(Math.sin(p.yaw)),rx=c*shape.rx+n*shape.rz,rz=n*shape.rx+c*shape.rz,height=shape.height;
  let dashBlocked=false;const horizontalDt=p.dash?dashStep:dt;for(let sub=0,steps=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vz)*horizontalDt/.15));sub<steps;sub++)for(const axis of ['x','z']){p[axis]+=p[axis==='x'?'vx':'vz']*horizontalDt/steps;for(const [x,y,z,w,h,l]of BLOCKS){if(y+h<=p.y+.045||y>=p.y+height-.02)continue;if(p.x+rx>x-w/2&&p.x-rx<x+w/2&&p.z+rz>z-l/2&&p.z-rz<z+l/2){dashBlocked=true;const center=axis==='x'?x:z,half=(axis==='x'?w:l)/2,radius=axis==='x'?rx:rz;p[axis]=p[axis]<center?center-half-radius:center+half+radius;}}}
  if(p.dash){p.dash=Math.max(0,p.dash-dt);if(p.dash<1e-8)p.dash=0;if(dashBlocked)p.dash=0;if(!p.dash){p.vx=0;p.vz=0;}}
  const prev=p.y;p.y+=p.vy*dt;p.grounded=false;for(const [x,y,z,w,h,l]of BLOCKS){if(p.x+rx<=x-w/2||p.x-rx>=x+w/2||p.z+rz<=z-l/2||p.z-rz>=z+l/2)continue;
   if(p.vy<=0&&prev>=y+h-.06&&p.y<=y+h){p.y=y+h;p.vy=0;p.grounded=true;}
   else if(p.vy>0&&prev+height<=y+.04&&p.y+height>=y){p.y=y-height;p.vy=0;}}
  if(p.y<0){p.y=0;p.vy=0;p.grounded=true;}if(p.y>CFG.flightHeight){p.y=CFG.flightHeight;p.vy=Math.min(0,p.vy);}p.x=Math.max(-15.1,Math.min(15.1,p.x));p.z=Math.max(-19.1,Math.min(19.1,p.z));
  const desired=p.lean+(i.lean-p.lean)*Math.min(1,CFG.leanSpeed*dt),base=toWorld({...p,lean:0},eyeLocal({...p,lean:0})),target=toWorld(p,eyeLocal({...p,lean:desired})),offset=target.map((v,k)=>v-base[k]),length=Math.hypot(...offset);p.lean=desired;
  if(length>.001){const blocked=wallDistance(base,offset.map(v=>v/length));if(blocked<length+.16*s)p.lean*=Math.max(0,(blocked-.16*s)/length);}
  const traveled=Math.hypot(p.x-oldX,p.z-oldZ);p.walkPhase+=traveled*(p.stance===2?5:3.8);
  if(p.grounded&&traveled>.001){p.footDistance+=traveled;if(p.footDistance>=(p.sprinting?1.8:p.stance===1?1.1:1.35)){p.footDistance=0;if(!has(p,'silent'))this.emit('step',{who:p.id,x:p.x,z:p.z,stance:p.stance,sprint:p.sprinting});}}
  if(!wasGrounded&&p.grounded&&!has(p,'silent'))this.emit('land',{who:p.id,x:p.x,z:p.z});
 }
 shoot(p){const q=this.players[1-p.id],o=eye(p);let yaw=p.yaw,pitch=p.pitch;if(has(p,'aim')&&pitch>-1.1){const t=lockTarget(p,q);if(t){const a=aimAngles(o,t);yaw=a.yaw;pitch=a.pitch;}}
  // Converge third-person crosshair toward a point, but always test obstruction from the body.
  if(has(p,'third')&&!(has(p,'aim')&&lockTarget(p,q)&&pitch>-1.1)){const cam=cameraPoint(p),view=direction(yaw,pitch),t=Math.min(CFG.range,wallDistance(cam,view)),a=aimAngles(o,cam.map((v,i)=>v+view[i]*t));yaw=a.yaw;pitch=a.pitch;}
  const raw=direction(yaw,pitch),spread=spreadFor(p),d=direction(yaw+(this.rng()-.5)*spread*2,pitch+(this.rng()-.5)*spread*2);p.cool=CFG.fire;p.shotAnim=.12;if(!has(p,'infinite'))p.ammo--;
  // Persistent downward firing produces upward recoil. Clamp keeps the arena bounded.
  if(raw[1]<-.25){p.vy=Math.min(CFG.maxLiftSpeed,Math.max(CFG.launchSpeed,p.vy+Math.max(0,-raw[1])*CFG.recoilLift));p.grounded=false;this.emit('lift',{who:p.id,from:o.map((a,i)=>a+raw[i]*Math.min(3,wallDistance(o,raw)))});}
  const wall=wallDistance(o,d),hit=hitPlayer(o,d,q);let distance=Math.min(CFG.range,wall);let damage=0;
  if(hit.t<CFG.range&&(has(p,'wall')||hit.t<=wall+.015)){distance=hit.t;damage=CFG.damage[hit.part];q.hp=Math.max(0,q.hp-damage);q.hitAnim=.22;}
  else if(has(p,'wall'))distance=CFG.range;
  p.shotTarget=o.map((a,i)=>a+d[i]*distance);
  this.emit('shot',{who:p.id,from:o,to:p.shotTarget,part:damage?hit.part:null,damage,through:damage>0&&hit.t>wall});
  if(q.hp<=0)this.finish(p.id,`击败对手 · ${hit.part==='limb'?'四肢要害':hit.part==='head'?'头部命中':'躯干命中'}`);
 }
 botTick(dt){const p=this.players[1],q=this.players[0],bs=this.botState;const visibleTarget=lockTarget(p,q),target=visibleTarget||partCenter(q,has(q,'limbless')?PARTS[1]:PARTS[4]),o=eye(p),v=target.map((a,i)=>a-o[i]),dist=Math.hypot(...v),visible=!!visibleTarget;
  bs.reaction=visible?bs.reaction+dt:0;const knows=visible||has(p,'esp')||this.time<=CFG.revealTime;const route=[[-12,-8],[-12,8],[-5,15],[5,15],[12,8],[12,-8],[5,-15],[-5,-15]];
  let dest;if(knows){dest=[q.x,q.z];bs.last=[q.x,q.z];}else{dest=bs.last||route[bs.waypoint%route.length];if(Math.hypot(dest[0]-p.x,dest[1]-p.z)<1.5){bs.last=null;bs.waypoint++;}}
  bs.next-=dt;if(bs.next<=0){bs.path=findPath([p.x,p.z],dest);bs.next=.8;}while(bs.path?.length&&Math.hypot(bs.path[0][0]-p.x,bs.path[0][1]-p.z)<.65)bs.path.shift();const step=!visible&&bs.path?.length?bs.path[0]:dest;
  const walk=aimAngles(o,[step[0],p.y+1.5,step[1]]);let aim=(visible||has(p,'esp')&&has(p,'wall'))?aimAngles(o,target):walk;
  const speed=.9;const delta=Math.atan2(Math.sin(aim.yaw-p.yaw),Math.cos(aim.yaw-p.yaw));const yaw=p.yaw+Math.max(-speed*dt*5,Math.min(speed*dt*5,delta));
  const canWall=has(p,'wall')&&has(p,'esp'),fire=(visible&&bs.reaction>CFG.botReaction||canWall)&&dist<35;
  const rel=walk.yaw-yaw;this.input(1,{yaw,pitch:aim.pitch+Math.sin(this.time*2)*CFG.botAimError,forward:(visible&&dist<6)?-.4:Math.cos(rel),strafe:-Math.sin(rel)+(visible?Math.sin(this.time*1.3)*.4:0),sprint:!visible,crouch:visible&&p.hp<CFG.hp*.4&&Math.sin(this.time)>.3,jump:visible&&p.hp>=CFG.hp*.4&&Math.sin(this.time*2)>.35,fire,reload:p.ammo===0||(p.ammo<8&&!visible)});
 }
}
