import CFG from './generated-balance.js';
export const BASE_PARTS=[
 {id:'head',c:[0,1.64,0],size:[.34,.34,.34]},
 {id:'torso',c:[0,1.13,0],size:[.51,.65,.34]},
 {id:'limb',c:[-.37,1.13,0],size:[.2,.66,.24]},
 {id:'limb',c:[.37,1.13,0],size:[.2,.66,.24]},
 {id:'limb',c:[-.15,.4,0],size:[.23,.8,.28]},
 {id:'limb',c:[.15,.4,0],size:[.23,.8,.28]}
];
export const stanceName=p=>p.stance===2?'趴下':p.stance===1?'下蹲':p.sprinting?'冲刺':'站立';
export function bodyShape(p,stance=p.stance||0){const s=p.cheats.includes('small')?CFG.smallScale:1;if(stance===2)return{height:.55*s,rx:.48*s,rz:.98*s};if(stance===1)return{height:1.25*s,rx:.3*s,rz:.3*s};return{height:1.82*s,rx:.3*s,rz:.3*s};}
export function leanPoint(p,point){const stance=p.stance||0,pivot=stance===2?.2:stance===1?.37:.7;if(point[1]<pivot+.1)return [...point];const a=-(p.lean||0)*CFG.leanAngle*(stance===2?.3:1),c=Math.cos(a),s=Math.sin(a),dy=point[1]-pivot;return[point[0]*c-dy*s,pivot+point[0]*s+dy*c,point[2]];}
export function eyeLocal(p){const point=p.stance===2?[0,.4,-.77]:p.stance===1?[0,1.04,0]:[0,1.58,0];return leanPoint(p,point);}
export function poseParts(p){const stance=p.stance||0,parts=BASE_PARTS.map(part=>({...part,c:[...part.c],size:[...part.size],rx:0,rz:0}));
 if(stance===1){parts[0].c=[0,1.05,-.04];parts[1].c=[0,.71,.02];parts[1].size=[.51,.45,.34];for(const j of [2,3]){parts[j].c=[j===2?-.35:.35,.75,-.05];parts[j].size=[.2,.48,.24];}for(const j of [4,5]){parts[j].c=[j===4?-.18:.18,.25,.1];parts[j].size=[.23,.5,.32];}}
 if(stance===2){parts[0].c=[0,.34,-.74];parts[1].c=[0,.28,-.1];parts[1].size=[.51,.32,.8];for(const j of [2,3]){parts[j].c=[j===2?-.38:.38,.22,-.6];parts[j].size=[.2,.2,.68];}for(const j of [4,5]){parts[j].c=[j===4?-.16:.16,.19,.65];parts[j].size=[.23,.24,.8];}}
 const moving=Math.min(1,Math.hypot(p.vx||0,p.vz||0)/CFG.speed),phase=p.walkPhase||0;
 if(stance<2){for(const j of [4,5]){const swing=Math.sin(phase+(j===4?0:Math.PI))*(p.grounded?moving*(p.sprinting?.8:.5):.45),part=parts[j],length=part.size[1]/2,pivot=part.c[1]+length;part.rx=swing;part.c[1]=pivot-length*Math.cos(swing);part.c[2]+=Math.sin(swing)*length;}
  for(const j of [2,3]){const part=parts[j],swing=p.reload>0?.45+Math.sin(p.reload*9)*.2:1.12+(p.pitch||0)*.7+Math.sin(phase+(j===2?Math.PI:0))*moving*.035-(p.shotAnim||0)*.3;const half=part.size[1]/2;part.rx=swing;part.c[1]+=half*(1-Math.cos(swing));part.c[2]-=Math.sin(swing)*half;}
 }
 if(stance===2&&moving>0){for(const j of [2,3,4,5])parts[j].c[2]+=Math.sin(phase+(j%2?Math.PI:0))*moving*.07;}
 for(const part of parts){const upper=part.c[1]>(stance===2?.25:stance===1?.5:.8);if(upper){part.c=leanPoint(p,part.c);part.rz=-(p.lean||0)*CFG.leanAngle*(stance===2?.3:1);}}
 return parts;
}
