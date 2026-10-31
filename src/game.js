// Shared authoritative rules: browser bot match and WebRTC host run this same world.
import balance from './generated-balance.js';
import {BASE_PARTS,poseParts,eyeLocal,bodyShape,leanPoint,stanceName,stanceWeights} from './pose.js';
export {poseParts,bodyShape,leanPoint,stanceName,stanceWeights};
export const CFG=balance;
export const CHEATS = [
  {id:'esp',name:'透视',en:'WALL VISION',icon:'◉',desc:'持续看见敌人位置和轮廓；目标有“没有脚步”时无法透视其轮廓。'},
  {id:'aim',name:'自瞄',en:'LIMB LOCK',icon:'⌖',desc:'开火锁定视线内的四肢；仅在前方可见四肢内锁定；没有四肢会使自瞄失效。大幅低头时优先射地起飞。'},
  {id:'wall',name:'子弹穿墙',en:'WALLBREAKER',icon:'↗',desc:'穿透场地内所有墙体和掩体，伤害不衰减；地图边界不可穿透。不能隔墙自动锁定。'},
  {id:'silent',name:'没有脚步',en:'GHOST STEP',icon:'∅',desc:'移动与落地无声，同时屏蔽敌方透视轮廓；枪声和正常视线仍会暴露你。'},
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
export function wallDistance(o,d,penetrate=false){let t=Infinity;for(const [x,y,z,w,h,l,kind] of BLOCKS){if(penetrate&&kind!=='boundary')continue;t=Math.min(t,rayBox(o,d,[x-w/2,y,z-l/2],[x+w/2,y+h,z+l/2]));}return t;}
export const PARTS=BASE_PARTS;
export function partCenter(p,part){const index=PARTS.indexOf(part);return toWorld(p,index<0?part.c:poseParts(p)[index].c);}
export function hitPlayer(o,d,p){const s=scale(p),c=Math.cos(p.yaw),n=Math.sin(p.yaw),dx=o[0]-p.x,dz=o[2]-p.z;
 const ro=[(dx*c-dz*n)/s,(o[1]-p.y)/s,(dx*n+dz*c)/s],rd=[(d[0]*c-d[2]*n)/s,d[1]/s,(d[0]*n+d[2]*c)/s];let hit={t:Infinity,part:null};
 for(const part of poseParts(p)){if(part.id==='limb'&&has(p,'limbless'))continue;const co=Math.cos(part.rz),si=Math.sin(part.rz),cx=Math.cos(part.rx),sx=Math.sin(part.rx),v=ro.map((x,i)=>x-part.c[i]);
  const rotate=([x,y,z])=>{const a=x*co+y*si,b=-x*si+y*co;return[a,b*cx+z*sx,-b*sx+z*cx];};
  const t=rayBox(rotate(v),rotate(rd),part.size.map(x=>-x/2),part.size.map(x=>x/2));if(t<hit.t)hit={t,part:part.id};}return hit;}
export const seesOutline=(viewer,target)=>has(viewer,'esp')&&!has(target,'silent');
export function gunMount(p){const e=eyeLocal(p);return [e[0]+.22,e[1]-.28,e[2]-.34];}
export function muzzle(p){const e=eye(p),mount=toWorld(p,gunMount(p)),d=direction(p.yaw,p.pitch),end=mount.map((v,i)=>v+d[i]*.57*scale(p)),v=end.map((x,i)=>x-e[i]),len=Math.hypot(...v),n=v.map(x=>x/len),clear=Math.max(0,Math.min(len,wallDistance(e,n)-.04));return e.map((x,i)=>x+n[i]*clear);}
export function viewTarget(p,q){const cam=cameraPoint(p),d=direction(p.yaw,p.pitch),wall=wallDistance(cam,d,has(p,'wall')),hit=hitPlayer(cam,d,q),t=Math.min(CFG.range,wall,hit.t);return cam.map((x,i)=>x+d[i]*t);}
export function lockTarget(p,q){if(has(q,'limbless'))return null;const o=muzzle(p),view=direction(p.yaw,p.pitch);let best=null,score=-1;for(const part of PARTS.filter(a=>a.id==='limb')){const target=partCenter(q,part),v=target.map((a,i)=>a-o[i]),l=Math.hypot(...v);if(l<.001)continue;const d=v.map(a=>a/l),dot=d.reduce((sum,a,i)=>sum+a*view[i],0);if(dot>Math.cos(CFG.aimCone)&&dot>score&&wallDistance(o,d)>l-.01){best=target;score=dot;}}return best;}
export const reloadTime=ammo=>Math.min(CFG.reloadPartial,CFG.reloadEmpty+CFG.reloadExtra*Math.min(ammo,CFG.mag/2)/CFG.mag);
export const spreadFor=p=>(!p.grounded?CFG.spread.air:p.dashingThisTick||Math.hypot(p.vx,p.vz)>CFG.moveThreshold?CFG.spread.move:CFG.spread.stand)*(p.aiming?CFG.aimSpread:1);
const emptyInput=()=>({forward:0,strafe:0,lean:0,crouch:false,prone:false,sprint:false,jump:false,fire:false,reload:false,aim:false,dashSeq:0,yaw:0,pitch:0});
function player(id){return {id,x:0,y:0,z:0,yaw:0,pitch:0,lean:0,vx:0,vy:0,vz:0,hp:CFG.hp,ammo:CFG.mag,reload:0,cool:0,cheats:[],grounded:true,input:emptyInput(),foot:0,footDistance:0,walkPhase:0,stance:0,sprinting:false,shotAnim:0,hitAnim:0,reloadDuration:0,reloadHeld:false,fireHeld:false,autoReloadSuppressed:false,dead:false,aiming:false,dash:0,dashCooldown:0,lastDashSeq:0,dashX:0,dashZ:0};}
function shuffle(arr,rng){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const walkable=(x,z)=>Math.abs(x)<15&&Math.abs(z)<19&&!BLOCKS.some(([bx,y,bz,w,h,d,kind])=>kind!=='floor'&&y<1.8&&y+h>.1&&Math.abs(x-bx)<w/2+.34&&Math.abs(z-bz)<d/2+.34);
// Small, deterministic navigation grid. Bots cannot see a target merely because a path exists.
export function findPath(from,to){const cell=1.5,start=[Math.round(from[0]/cell),Math.round(from[1]/cell)],goal=[Math.round(to[0]/cell),Math.round(to[1]/cell)],key=(x,z)=>`${x},${z}`;const queue=[start],seen=new Map([[key(...start),null]]);let best=start,bestD=Infinity;
 for(let i=0;i<queue.length;i++){const n=queue[i],dist=(n[0]-goal[0])**2+(n[1]-goal[1])**2;if(dist<bestD){best=n;bestD=dist;}if(dist===0)break;for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=n[0]+dx,z=n[1]+dz,k=key(x,z);if(!seen.has(k)&&walkable(x*cell,z*cell)){seen.set(k,n);queue.push([x,z]);}}}
 const result=[];let n=best;while(n){result.unshift(n.map(x=>x*cell));n=seen.get(key(...n));}const path=result.slice(1);if(bestD===0&&walkable(...to)&&Math.hypot((path.at(-1)?.[0]??from[0])-to[0],(path.at(-1)?.[1]??from[1])-to[1])>.01)path.push([...to]);return path;
}
export class Game{
 constructor({bot=false,rng=Math.random}={}){this.rng=rng;this.bot=bot;this.players=[player(0),player(1)];this.score=[0,0];this.round=0;this.time=0;this.events=[];this.eid=0;this.stage='select';this.ready=[false,false];this.botState={reaction:0,next:0,waypoint:0};this.newRound();}
 emit(type,data={}){this.events.push({id:++this.eid,type,...data});this.events=this.events.slice(-70);}
 newRound(){const sequences=this.players.map(p=>p.lastDashSeq);this.round++;this.prepare=0;this.botState={reaction:0,next:0,waypoint:0};this.time=CFG.roundTime;this.stage='select';this.ready=[false,false];this.winner=null;this.reason='';this.offers=[0,1].map(()=>shuffle(CHEATS.map(a=>a.id),this.rng).slice(0,3));this.players=[player(0),player(1)];for(let i=0;i<2;i++){this.players[i].lastDashSeq=sequences[i]||0;this.players[i].x=i?5:-5;this.players[i].z=i?-16:16;this.players[i].yaw=i?Math.PI:0;}if(this.bot)this.choose(1,shuffle(this.offers[1],this.rng).slice(0,2));}
 choose(id,ids){if(this.stage!=='select'||this.ready[id]||!Array.isArray(ids)||ids.length!==2||new Set(ids).size!==2||!ids.every(a=>this.offers[id]?.includes(a)))return false;this.players[id].cheats=[...ids];this.ready[id]=true;if(this.ready.every(Boolean)){this.stage='prepare';this.prepare=CFG.prepareTime;this.emit('prepare',{round:this.round});}return true;}
 input(id,data){if(!this.players[id]||!data)return;const p=this.players[id];p.input={forward:Math.max(-1,Math.min(1,Number(data.forward)||0)),strafe:Math.max(-1,Math.min(1,Number(data.strafe)||0)),lean:Math.max(-1,Math.min(1,Number(data.lean)||0)),crouch:!!data.crouch,prone:!!data.prone,sprint:!!data.sprint,jump:!!data.jump,fire:!!data.fire,reload:!!data.reload,aim:!!data.aim,dashSeq:Number.isSafeInteger(data.dashSeq)&&data.dashSeq>=0?data.dashSeq:0,yaw:Number.isFinite(data.yaw)?data.yaw:0,pitch:Math.max(-1.53,Math.min(1.53,Number(data.pitch)||0))};}
 snapshot(viewer=0){return {players:this.players.map(({input,...p})=>({...p,cheats:this.stage==='select'?[]:p.cheats})),score:this.score,round:this.round,time:this.time,prepare:this.prepare||0,stage:this.stage,ready:this.ready,offers:[...this.offers[viewer]],winner:this.winner,reason:this.reason,events:this.events};}
 next(){if(this.stage==='result'){if(this.winner===null)this.round--;this.newRound();}else if(this.stage==='over'){this.score=[0,0];this.round=0;this.newRound();}}
 tick(dt){if(!Number.isFinite(dt)||dt<=0)return;if(dt>.05){let remaining=Math.min(dt,.5);while(remaining>1e-8){const step=Math.min(1/60,remaining);this.tick(step);remaining-=step;}return;}if(this.stage==='prepare'){this.prepare=Math.max(0,this.prepare-dt);if(this.prepare<1e-8){this.prepare=0;this.stage='fight';for(const p of this.players)p.input=emptyInput();this.emit('start',{round:this.round});}return;}if(this.stage!=='fight')return;this.time=Math.max(0,this.time-dt);if(this.bot)this.botTick(dt);
  for(const p of this.players){if(this.stage!=='fight')break;this.move(p,dt);p.cool=p.input.fire&&!p.reload&&(p.fireHeld||p.cool>0)?Math.max(-dt,p.cool-dt):Math.max(0,p.cool-dt);p.shotAnim=Math.max(0,p.shotAnim-dt);p.hitAnim=Math.max(0,p.hitAnim-dt);
   const reloadPressed=p.input.reload&&!p.reloadHeld,firePressed=p.input.fire&&!p.fireHeld;p.reloadHeld=p.input.reload;p.fireHeld=p.input.fire;
   const dashStarted=p.dashCooldown===CFG.dashCooldown;
   if(p.reload>0&&(reloadPressed||dashStarted||(p.ammo>0&&firePressed))){this.cancelReload(p);}
   else if(p.reload>0){const before=p.reload;p.reload=Math.max(0,p.reload-dt);if(before>p.reloadDuration/2&&p.reload<=p.reloadDuration/2)this.emit('reloadClick',{who:p.id});if(p.reload===0){p.ammo=CFG.mag;p.autoReloadSuppressed=false;this.emit('loaded',{who:p.id});}}
   if(has(p,'regen'))p.hp=Math.min(CFG.hp,p.hp+CFG.regen*dt);
   if(!p.reload&&reloadPressed&&!p.cancelledThisTick)this.beginReload(p);
   if(!p.reload&&p.ammo===0&&!has(p,'infinite')&&!p.cancelledThisTick&&(!p.autoReloadSuppressed||firePressed))this.beginReload(p);
   if(p.input.fire&&!p.reload&&p.cool<=1e-8&&p.ammo>0){this.shoot(p);if(p.ammo===0&&this.stage==='fight')this.beginReload(p);}p.cancelledThisTick=false;
  }
  if(this.stage==='fight'&&this.time===0){const [a,b]=this.players;if(Math.abs(a.hp-b.hp)<.01)this.finish(null,'生命相同 · 本回合重赛');else this.finish(a.hp>b.hp?0:1,'时间到 · 剩余生命判胜');}
 }
 beginReload(p){if(has(p,'infinite')||p.ammo>=CFG.mag||p.reload)return;p.reload=reloadTime(p.ammo);p.reloadDuration=p.reload;p.autoReloadSuppressed=false;this.emit('reload',{who:p.id,empty:p.ammo===0});}
 cancelReload(p){p.reload=0;p.cancelledThisTick=true;p.autoReloadSuppressed=true;this.emit('reloadCancel',{who:p.id});}
 finish(winner,reason){this.winner=winner;this.reason=reason;if(winner!==null)this.score[winner]++;this.stage=this.score.some(s=>s>=CFG.winsToWin)?'over':'result';if(winner!==null)this.players[1-winner].dead=true;this.emit('end',{winner,reason,score:[...this.score],match:this.stage==='over'});for(const p of this.players)p.input=emptyInput();}
 canOccupy(p,stance){const shape=bodyShape(p,stance),c=Math.abs(Math.cos(p.yaw)),n=Math.abs(Math.sin(p.yaw)),rx=c*shape.rx+n*shape.rz,rz=n*shape.rx+c*shape.rz;
  return !BLOCKS.some(([x,y,z,w,h,l])=>y+h>p.y+.04&&y<p.y+shape.height-.02&&Math.abs(p.x-x)<w/2+rx-.01&&Math.abs(p.z-z)<l/2+rz-.01);}
 leanBlocked(p){return poseParts(p).filter(part=>part.leanWeight>0).some(part=>{const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(const a of [-1,1])for(const b of [-1,1])for(const c of [-1,1]){const x=a*part.size[0]/2,y=b*part.size[1]/2,z=c*part.size[2]/2,ry=y*Math.cos(part.rx)-z*Math.sin(part.rx),rz=y*Math.sin(part.rx)+z*Math.cos(part.rx),point=toWorld(p,[part.c[0]+x*Math.cos(part.rz)-ry*Math.sin(part.rz),part.c[1]+x*Math.sin(part.rz)+ry*Math.cos(part.rz),part.c[2]+rz]);for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],point[k]);hi[k]=Math.max(hi[k],point[k]);}}return BLOCKS.some(([x,y,z,w,h,d])=>hi[0]>x-w/2+.015&&lo[0]<x+w/2-.015&&hi[1]>y+.015&&lo[1]<y+h-.015&&hi[2]>z-d/2+.015&&lo[2]<z+d/2-.015);});}
 move(p,dt){const i=p.input;p.yaw=i.yaw;p.pitch=i.pitch;const wasGrounded=p.grounded,oldX=p.x,oldZ=p.z;
  const wanted=i.prone?2:i.crouch?1:0;if(wanted!==p.stance&&this.canOccupy(p,wanted)){p.poseFrom=stanceWeights(p);p.stance=wanted;p.poseBlend=0;}
  if(p.poseBlend!==undefined)p.poseBlend=Math.min(1,p.poseBlend+dt/CFG.stanceDuration);
  p.dashCooldown=Math.max(0,p.dashCooldown-dt);
  if(i.dashSeq>p.lastDashSeq){p.lastDashSeq=i.dashSeq;if(i.dashSeq>0&&p.dashCooldown<1e-8){const len=Math.hypot(i.forward,i.strafe),f=len?i.forward/len:1,r=len?i.strafe/len:0;p.dashX=-Math.sin(p.yaw)*f+Math.cos(p.yaw)*r;p.dashZ=-Math.cos(p.yaw)*f-Math.sin(p.yaw)*r;p.dash=CFG.dashDuration;p.dashCooldown=CFG.dashCooldown;this.emit('dash',{who:p.id,seq:i.dashSeq,from:[p.x,p.y+.6,p.z],direction:[p.dashX,p.dashZ]});}}
  const dashStep=Math.min(dt,p.dash);p.dashingThisTick=dashStep>0;p.aiming=!!i.aim&&!p.dash;
  p.sprinting=!p.aiming&&!p.dash&&!!i.sprint&&p.stance===0&&Math.hypot(i.forward,i.strafe)>0;
  const modifier=p.stance===2?CFG.proneSpeed:p.stance===1?CFG.crouchSpeed:p.sprinting?(has(p,'speed')?CFG.speedMultiplier:CFG.sprintMultiplier):1;
  const speed=CFG.speed*modifier*(p.aiming?CFG.aimSpeed:1),len=Math.max(1,Math.hypot(i.forward,i.strafe));
  const targetX=(-Math.sin(p.yaw)*i.forward+Math.cos(p.yaw)*i.strafe)/len*speed,targetZ=(-Math.cos(p.yaw)*i.forward-Math.sin(p.yaw)*i.strafe)/len*speed;
  const rate=!p.grounded?CFG.airAcceleration*(p.aiming?CFG.aimAir:1):Math.hypot(i.forward,i.strafe)>0?CFG.acceleration:CFG.deceleration,dv=Math.hypot(targetX-p.vx,targetZ-p.vz),blend=dv>0?Math.min(1,rate*dt/dv):1;
  if(p.dash){const speed=CFG.dashDistance/CFG.dashDuration;p.vx=p.dashX*speed;p.vz=p.dashZ*speed;}else{p.vx+=(targetX-p.vx)*blend;p.vz+=(targetZ-p.vz)*blend;}
  if(i.jump&&!p.dash&&p.grounded&&p.stance===0){p.vy=CFG.jumpVelocity*(p.aiming?CFG.aimJump:1);p.grounded=false;}p.vy=Math.max(-CFG.maxFallSpeed,p.vy-CFG.gravity*dt);
  const shape=bodyShape(p),s=scale(p),c=Math.abs(Math.cos(p.yaw)),n=Math.abs(Math.sin(p.yaw)),rx=c*shape.rx+n*shape.rz,rz=n*shape.rx+c*shape.rz,height=shape.height;
  let dashBlocked=false;const horizontalDt=p.dash?dashStep:dt;for(let sub=0,steps=Math.max(1,Math.ceil(Math.hypot(p.vx,p.vz)*horizontalDt/.15));sub<steps&&!(p.dash&&dashBlocked);sub++)for(const axis of ['x','z']){if(p.dash&&dashBlocked)break;const prior=p[axis];p[axis]+=p[axis==='x'?'vx':'vz']*horizontalDt/steps;if(p.lean&&this.leanBlocked(p)){p[axis]=prior;dashBlocked=true;}for(const [x,y,z,w,h,l]of BLOCKS){if(y+h<=p.y+.045||y>=p.y+height-.02)continue;if(p.x+rx>x-w/2&&p.x-rx<x+w/2&&p.z+rz>z-l/2&&p.z-rz<z+l/2){dashBlocked=true;const center=axis==='x'?x:z,half=(axis==='x'?w:l)/2,radius=axis==='x'?rx:rz;p[axis]=p[axis]<center?center-half-radius:center+half+radius;}}}
  if(p.dash){p.dash=Math.max(0,p.dash-dt);if(p.dash<1e-8)p.dash=0;if(dashBlocked)p.dash=0;if(!p.dash){p.vx=0;p.vz=0;this.emit('dashEnd',{who:p.id,blocked:dashBlocked,from:[p.x,p.y+.6,p.z]});}}
  const prev=p.y;p.y+=p.vy*dt;p.grounded=false;for(const [x,y,z,w,h,l]of BLOCKS){if(p.x+rx<=x-w/2||p.x-rx>=x+w/2||p.z+rz<=z-l/2||p.z-rz>=z+l/2)continue;
   if(p.vy<=0&&prev>=y+h-.06&&p.y<=y+h){p.y=y+h;p.vy=0;p.grounded=true;}
   else if(p.vy>0&&prev+height<=y+.04&&p.y+height>=y){p.y=y-height;p.vy=0;}}
  if(p.y<0){p.y=0;p.vy=0;p.grounded=true;}if(p.y>CFG.flightHeight){p.y=CFG.flightHeight;p.vy=Math.min(0,p.vy);}p.x=Math.max(-15.1,Math.min(15.1,p.x));p.z=Math.max(-19.1,Math.min(19.1,p.z));
  if(p.lean&&this.leanBlocked(p))p.lean=0;
  const amount=Math.max(-CFG.leanSpeed*dt,Math.min(CFG.leanSpeed*dt,i.lean-p.lean)),desired=p.lean+amount;
  let lo=0,hi=1;for(let n=0;n<9;n++){const mid=(lo+hi)/2;if(this.leanBlocked({...p,lean:p.lean+amount*mid}))hi=mid;else lo=mid;}p.lean=p.lean+amount*lo;
  const traveled=Math.hypot(p.x-oldX,p.z-oldZ);p.walkPhase+=traveled*(p.stance===2?5:3.8);
  if(p.grounded&&traveled>.001){p.footDistance+=traveled;if(p.footDistance>=(p.sprinting?1.8:p.stance===1?1.1:1.35)){p.footDistance=0;if(!has(p,'silent'))this.emit('step',{who:p.id,x:p.x,z:p.z,stance:p.stance,sprint:p.sprinting});}}
  if(!wasGrounded&&p.grounded&&!has(p,'silent'))this.emit('land',{who:p.id,x:p.x,z:p.z});
 }
 shoot(p){const actual=this.players[1-p.id],q=this.rewindTarget?.(1-p.id,p.rewindAge)||actual,o=muzzle(p),wasAirborne=!p.grounded;let target=viewTarget(p,q),locked=false;
  if(has(p,'aim')&&p.pitch>-1.1){const assisted=lockTarget(p,q);if(assisted){target=assisted;locked=true;}}
  const angles=aimAngles(o,target),spread=locked?0:spreadFor(p),d=direction(angles.yaw+(this.rng()-.5)*spread*2,angles.pitch+(this.rng()-.5)*spread*2);p.cool=Math.max(-.05,p.cool)+CFG.fire;p.shotAnim=.12;if(!has(p,'infinite'))p.ammo--;
  const solid=wallDistance(o,d),wall=wallDistance(o,d,has(p,'wall')),hit=hitPlayer(o,d,q);let distance=Math.min(CFG.range,wall),damage=0;
  if(hit.t<CFG.range&&hit.t<=wall+.015){distance=hit.t;damage=CFG.damage[hit.part];actual.hp=Math.max(0,actual.hp-damage);actual.hitAnim=.22;}
  if(d[1]<-.25&&!(wasAirborne&&damage>0)){p.vy=Math.min(CFG.maxLiftSpeed,Math.max(CFG.launchSpeed,p.vy-d[1]*CFG.recoilLift));p.grounded=false;this.emit('lift',{who:p.id,from:o.map((a,i)=>a+d[i]*Math.min(3,solid))});}
  p.shotTarget=o.map((a,i)=>a+d[i]*distance);this.emit('shot',{who:p.id,from:o,to:p.shotTarget,part:damage?hit.part:null,damage,through:damage>0&&hit.t>solid});
  if(actual.hp<=0)this.finish(p.id,`击败对手 · ${hit.part==='limb'?'四肢要害':hit.part==='head'?'头部命中':'躯干命中'}`);
 }
 botTick(dt){const p=this.players[1],q=this.players[0],bs=this.botState,points=[PARTS[0],PARTS[1],...PARTS.filter(x=>x.id==='limb')].filter(x=>!(x.id==='limb'&&has(q,'limbless'))).map(part=>partCenter(q,part)),o=eye(p);
  const clear=t=>{const v=t.map((a,i)=>a-o[i]),l=Math.hypot(...v);return wallDistance(o,v.map(a=>a/l))>=l-.03;},visible=points.some(clear),dist=Math.hypot(p.x-q.x,p.z-q.z),heard=!has(q,'silent')&&dist<10&&Math.hypot(q.vx,q.vz)>CFG.moveThreshold,aware=visible||seesOutline(p,q);
  if(aware&&!bs.aware)bs.reaction=CFG.botReaction;bs.aware=aware;bs.reaction=Math.max(0,(bs.reaction||0)-dt);bs.track=(bs.track||0)-dt;
  if(aware&&bs.track<=0){bs.aim=partCenter(q,has(q,'limbless')?PARTS[1]:PARTS[4]);bs.track=CFG.botTrackInterval;}
  if(visible||heard||seesOutline(p,q)){bs.last=[q.x,q.z];bs.search=5;}else bs.search=Math.max(0,(bs.search||0)-dt);
  const route=[[-12,-8],[-12,8],[-5,15],[5,15],[12,8],[12,-8],[5,-15],[-5,-15]],dest=bs.search>0?bs.last:route[Math.floor((CFG.roundTime-this.time)/6)%route.length];bs.next-=dt;if(bs.next<=0){bs.path=findPath([p.x,p.z],dest);bs.next=.6;}
  while(bs.path?.length&&Math.hypot(bs.path[0][0]-p.x,bs.path[0][1]-p.z)<.65)bs.path.shift();const wp=bs.path?.[0],walk=wp?aimAngles(o,[wp[0],o[1],wp[1]]):{yaw:p.yaw,pitch:0},desired=aware&&bs.aim?aimAngles(o,bs.aim):walk,t=CFG.roundTime-this.time,error=has(p,'aim')?0:CFG.botAimError;
  desired.yaw+=Math.sin(t*2.7)*error;desired.pitch+=Math.cos(t*3.1)*error;const delta=Math.atan2(Math.sin(desired.yaw-p.yaw),Math.cos(desired.yaw-p.yaw)),yaw=p.yaw+Math.max(-dt*2.8,Math.min(dt*2.8,delta)),pitch=p.pitch+Math.max(-dt*2.5,Math.min(dt*2.5,desired.pitch-p.pitch));
  const rel=walk.yaw-yaw;let forward=wp?Math.cos(rel):0,strafe=wp?-Math.sin(rel):0;if(visible&&dist<10){forward=dist<4?-.45:.1;strafe=Math.sin(t*1.25)>0?.6:-.6;}
  this.input(1,{yaw,pitch,forward,strafe,sprint:!visible||dist>13,jump:visible&&Math.sin(t*1.3)>.95,crouch:visible&&dist>8&&Math.sin(t*.8)>.9,fire:aware&&bs.reaction===0&&Math.abs(delta)<.14&&(visible||has(p,'wall'))&&t%1.3<.75,reload:p.ammo===0&&!p.reload});
 }
}
