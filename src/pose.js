import CFG from './generated-balance.js';
export const BASE_PARTS=[
 {id:'head',c:[0,1.64,0],size:[.34,.34,.34]},
 {id:'torso',c:[0,1.13,0],size:[.51,.65,.34]},
 {id:'limb',c:[-.37,1.13,0],size:[.2,.66,.24]},
 {id:'limb',c:[.37,1.13,0],size:[.2,.66,.24]},
 {id:'limb',c:[-.15,.4,0],size:[.23,.8,.28]},
 {id:'limb',c:[.15,.4,0],size:[.23,.8,.28]}
];
export function stanceWeights(p){const target=[0,0,0];target[p.stance||0]=1;if(!p.poseFrom||p.poseBlend>=1)return target;const t=Math.max(0,p.poseBlend||0),a=t*t*(3-2*t);return target.map((v,i)=>(p.poseFrom[i]||0)*(1-a)+v*a);}
export const stanceName=p=>p.stance===2?'趴下':p.stance===1?'下蹲':p.sprinting?'冲刺':'站立';
function shapeAt(p,stance){const s=p.cheats.includes('small')?CFG.smallScale:1;if(stance===2)return{height:.55*s,rx:.48*s,rz:.98*s};if(stance===1)return{height:1.25*s,rx:.3*s,rz:.3*s};return{height:1.82*s,rx:.3*s,rz:.3*s};}
export function bodyShape(p,stance){if(stance!==undefined)return shapeAt(p,stance);const weights=stanceWeights(p),shapes=weights.map((_,i)=>shapeAt(p,i));return Object.fromEntries(['height','rx','rz'].map(key=>[key,Math.max(...shapes.filter((_,i)=>weights[i]>1e-6).map(s=>s[key]))]));}
export function leanPoint(p,point,weight=1){return [point[0]+(p.lean||0)*CFG.leanDistance*weight,point[1],point[2]];}
export function eyeLocal(p){const weights=stanceWeights(p),points=[[0,1.58,0],[0,1.04,0],[0,.4,-.77]],point=[0,1,2].map(k=>weights.reduce((v,w,i)=>v+w*points[i][k],0));return leanPoint(p,point);}
function partsAt(p,stance){const parts=BASE_PARTS.map(part=>({...part,c:[...part.c],size:[...part.size],rx:0,rz:0}));
 if(stance===1){parts[0].c=[0,1.05,-.04];parts[1].c=[0,.71,.02];parts[1].size=[.51,.45,.34];for(const j of [2,3]){parts[j].c=[j===2?-.35:.35,.75,-.05];parts[j].size=[.2,.48,.24];}for(const j of [4,5]){parts[j].c=[j===4?-.18:.18,.25,.1];parts[j].size=[.23,.5,.32];}}
 if(stance===2){parts[0].c=[0,.34,-.74];parts[1].c=[0,.28,-.1];parts[1].size=[.51,.32,.8];for(const j of [2,3]){parts[j].c=[j===2?-.38:.38,.22,-.6];parts[j].size=[.2,.2,.68];}for(const j of [4,5]){parts[j].c=[j===4?-.16:.16,.19,.65];parts[j].size=[.23,.24,.8];}}
 return parts;
}
export function poseParts(p){const stance=p.stance||0,weights=stanceWeights(p),poses=[0,1,2].map(i=>partsAt(p,i)),parts=BASE_PARTS.map((base,j)=>({...base,c:[0,1,2].map(k=>weights.reduce((v,w,i)=>v+w*poses[i][j].c[k],0)),size:[0,1,2].map(k=>weights.reduce((v,w,i)=>v+w*poses[i][j].size[k],0)),rx:0,rz:0}));
 const moving=Math.min(1,Math.hypot(p.vx||0,p.vz||0)/CFG.speed),phase=p.walkPhase||0;
 const upright=weights[0]+weights[1];if(upright>0){for(const j of [4,5]){const swing=Math.sin(phase+(j===4?0:Math.PI))*(p.grounded?moving*(p.sprinting?.8:.5):.45),part=parts[j],length=part.size[1]/2,pivot=part.c[1]+length;part.rx=swing*upright;part.c[1]=pivot-length*Math.cos(swing*upright);part.c[2]+=Math.sin(swing*upright)*length;}
  for(const j of [2,3]){const part=parts[j],swing=p.reload>0?.45+Math.sin(p.reload*9)*.2:1.12+(p.pitch||0)*.7+Math.sin(phase+(j===2?Math.PI:0))*moving*.035-(p.shotAnim||0)*.3;const half=part.size[1]/2;part.rx=swing*upright;part.c[1]+=half*(1-Math.cos(swing*upright));part.c[2]-=Math.sin(swing*upright)*half;}
 }
 if(weights[2]>0&&moving>0){for(const j of [2,3,4,5])parts[j].c[2]+=Math.sin(phase+(j%2?Math.PI:0))*moving*.07*weights[2];}
 for(let j=0;j<parts.length;j++){const part=parts[j],weight=j===0?1:j===1?.52:j<4?.5:0;part.leanWeight=weight;part.c=leanPoint(p,part.c,weight);
  if(p.dash>0){const side=p.dashX*Math.cos(p.yaw)-p.dashZ*Math.sin(p.yaw),f=-p.dashX*Math.sin(p.yaw)-p.dashZ*Math.cos(p.yaw);part.c[0]+=side*part.c[1]*.04;part.c[2]-=f*part.c[1]*.04;}}
 return parts;
}
