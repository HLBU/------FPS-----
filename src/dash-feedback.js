import * as THREE from 'three';
import {CFG,poseParts,scale} from './game.js';
// Front-loaded displacement; use its integral so distance is independent of tick size.

export function createDashFeedback(scene){
 const layer=document.createElement('div');layer.id='dashFeedback';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 for(let i=0;i<32;i++){const line=document.createElement('i');line.style.setProperty('--angle',`${i*11.25}deg`);layer.append(line);}
 const jetGeo=new THREE.ConeGeometry(.24,1.4,6,1,true),geo=new THREE.BoxGeometry(1,1,1),ghosts=[],timers=[0,0];let own=0,tail=0,side=0,forward=1;
 function start(e,p,myId,yaw){if(e.who===myId){layer.dataset.stop='';own=CFG.dashDuration;tail=.13;const dx=e.direction?.[0]||0,dz=e.direction?.[1]||0;side=dx*Math.cos(yaw)-dz*Math.sin(yaw);forward=-dx*Math.sin(yaw)-dz*Math.cos(yaw);}}
 function end(e,myId){if(e.who===myId){own=0;tail=e.blocked?.1:.13;layer.dataset.stop=e.blocked?'wall':'land';}}
 function update(dt,state,myId,settings){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,strength=reduced||settings.dashMotion<.5?0:settings.effects;own=Math.max(0,own-dt);tail=Math.max(0,tail-dt);const pulse=(own>0?Math.max(.25,own/CFG.dashDuration):tail/.13*.22)*strength;
  layer.style.opacity=pulse;layer.style.setProperty('--side',`${side*8}%`);layer.style.setProperty('--forward',`${forward*5}%`);layer.style.display=strength>0?'':'none';
  if(state?.stage==='fight')for(const p of state.players){timers[p.id]-=dt;if(p.dash>0&&timers[p.id]<=0&&strength>.05){timers[p.id]=.045;const g=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:'#89ecdd',transparent:true,opacity:.24*strength,depthWrite:false});for(const part of poseParts(p)){if(part.id==='limb'&&p.cheats.includes('limbless'))continue;const mesh=new THREE.Mesh(geo,material);mesh.position.set(...part.c);mesh.scale.set(...part.size);mesh.rotation.set(part.rx,0,part.rz,'ZXY');g.add(mesh);}g.position.set(p.x,p.y,p.z);g.rotation.y=p.yaw;g.scale.setScalar(scale(p));const jet=new THREE.Mesh(jetGeo,material);jet.position.set(0,.4,0);const c=Math.cos(p.yaw),n=Math.sin(p.yaw),back=new THREE.Vector3(-(p.dashX*c-p.dashZ*n),0,-(p.dashX*n+p.dashZ*c));jet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),back.normalize());g.add(jet);scene.add(g);ghosts.push({g,material,ttl:.21,strength});}}
  for(let i=ghosts.length-1;i>=0;i--){const g=ghosts[i];g.ttl-=dt;g.material.opacity=Math.max(0,g.ttl/.21)*.24*g.strength;if(g.ttl<=0||!state||strength===0){scene.remove(g.g);g.material.dispose();ghosts.splice(i,1);}}
  return {fov:pulse*CFG.dashFov,roll:-side*pulse*.025*settings.shake,kick:pulse*.08};
 }
 function clear(){own=tail=0;layer.style.opacity=0;for(const g of ghosts){scene.remove(g.g);g.material.dispose();}ghosts.length=0;}
 return {start,end,update,clear};
}
