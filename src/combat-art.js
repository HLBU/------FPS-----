import * as T from 'three';
import {VISUAL as V} from './visual-style.js';

export function createCombatArt(scene){
 const rings=[],trails=[],geometry=new T.RingGeometry(.8,1,40),trailGeometry=new T.BoxGeometry(.035,.025,.7);
 function ring(at,color,floor,size,life,intensity,normal=null){
  if(intensity<=0)return;
  if(rings.length>=20)remove(0);
  const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:.7*intensity,depthWrite:false,side:T.DoubleSide}));
  mesh.position.set(...at);if(floor)mesh.rotation.x=-Math.PI/2;if(normal)mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...normal));mesh.renderOrder=2;scene.add(mesh);rings.push({mesh,size,life,left:life,intensity,floor,normal});
 }
 function remove(i){const r=rings[i];scene.remove(r.mesh);r.mesh.material.dispose();rings.splice(i,1);}
 return {
  lift(at,intensity){ring(at,V.yellow,true,.65,V.liftSeconds,intensity);},
  hit(at,part,intensity){ring(at,part==='limb'?V.yellow:V.ivory,false,part==='limb'?.14:.07,.16,intensity);},
  land(at,intensity){ring(at,'#bec9bc',true,.45,.26,intensity*.5);},
  pierce(surfaces,intensity){for(const s of surfaces)ring(s.at,V.violet,false,.11,.27,intensity,s.normal);},
  speed(at,yaw,intensity){
   if(intensity<=0)return;if(trails.length>=24){const old=trails.shift();scene.remove(old.mesh);old.mesh.material.dispose();}
   const mesh=new T.Mesh(trailGeometry,new T.MeshBasicMaterial({color:V.teal,transparent:true,opacity:.45*intensity,depthWrite:false}));mesh.position.set(...at);mesh.rotation.y=yaw;scene.add(mesh);trails.push({mesh,left:.18,intensity});
  },
  update(dt,camera,intensity){for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.left-=dt;if(r.left<=0||intensity<=0){remove(i);continue;}const t=1-r.left/r.life;r.mesh.scale.setScalar(r.size*(.45+t*1.8));r.mesh.material.opacity=(1-t)*.7*Math.min(r.intensity,intensity);if(!r.floor&&!r.normal)r.mesh.quaternion.copy(camera.quaternion);}for(let i=trails.length-1;i>=0;i--){const t=trails[i];t.left-=dt;if(t.left<=0||intensity<=0){scene.remove(t.mesh);t.mesh.material.dispose();trails.splice(i,1);}else t.mesh.material.opacity=t.left/.18*.45*Math.min(t.intensity,intensity);}},
  clear(){while(rings.length)remove(0);for(const t of trails){scene.remove(t.mesh);t.mesh.material.dispose();}trails.length=0;},
 };
}
