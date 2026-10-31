import {has,lockTarget,muzzle,direction,partCenter,PARTS,wallDistance,CFG,BLOCKS} from './game.js';

// Uses the same limb lock as simulation. Failure feedback requires visible body geometry.
export function aimFeedback(p,q){
 if(!has(p,'aim')||p.dead||q.dead)return {mode:'idle',point:null};
 if(p.pitch< -1.1)return {mode:'lift',point:null};
 const point=lockTarget(p,q);if(point)return {mode:'locked',point};
 if(has(q,'limbless')){
  const o=muzzle(p),view=direction(p.yaw,p.pitch);
  for(const part of PARTS.slice(0,2)){
   const target=partCenter(q,part),v=target.map((n,i)=>n-o[i]),len=Math.hypot(...v);
   if(len<.001||len>CFG.range)continue;const d=v.map(n=>n/len);
   if(d.reduce((a,n,i)=>a+n*view[i],0)>Math.cos(CFG.aimCone)&&wallDistance(o,d)>len-.01)return {mode:'no-limbs',point:null};
  }
 }
 return {mode:'search',point:null};
}

// Decorative entry/exit markers, derived from a confirmed shot segment only.
export function penetrationSurfaces(from,to){
 const delta=to.map((v,i)=>v-from[i]),length=Math.hypot(...delta);if(length<.001)return [];
 const d=delta.map(v=>v/length),hits=[];
 for(const [x,y,z,w,h,depth,kind]of BLOCKS){
  if(kind==='boundary'||kind==='floor')continue;
  const min=[x-w/2,y,z-depth/2],max=[x+w/2,y+h,z+depth/2];
  let near=-Infinity,far=Infinity,entryAxis=0,exitAxis=0;
  for(let i=0;i<3;i++){
   if(Math.abs(d[i])<1e-8){if(from[i]<min[i]||from[i]>max[i]){near=Infinity;break;}continue;}
   let a=(min[i]-from[i])/d[i],b=(max[i]-from[i])/d[i];if(a>b)[a,b]=[b,a];
   if(a>near){near=a;entryAxis=i;}if(b<far){far=b;exitAxis=i;}
  }
  if(near>far||far<0||near>length)continue;
  for(const [t,axis,side]of [[near,entryAxis,-1],[far,exitAxis,1]]){
   if(t<0||t>length)continue;const normal=[0,0,0];normal[axis]=Math.sign(d[axis])*side;
   hits.push({distance:t,at:from.map((v,i)=>v+d[i]*t+normal[i]*.018),normal});
  }
 }
 return hits.sort((a,b)=>a.distance-b.distance).slice(0,6);
}
