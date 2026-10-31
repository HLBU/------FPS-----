import * as T from 'three';
import {makeSoldier,updateSoldier} from './soldier.js';
import {poseParts,CFG} from './game.js';

// One reusable context for draft and match portrait. Never changes game players.
export function createCharacterPreview(){
 let renderer=null,scene,camera,actors,ghost,w=0,h=0,phase=0;
 function init(){
  try{renderer=new T.WebGLRenderer({alpha:true,antialias:true});}catch{return false;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.domElement.className='preview-canvas';renderer.domElement.setAttribute('aria-label','角色装备预览');
  scene=new T.Scene();scene.add(new T.HemisphereLight('#edf3dc','#263842',2.3));const light=new T.DirectionalLight('#fff4d2',2.6);light.position.set(-3,5,4);scene.add(light);
  actors=[makeSoldier(0),makeSoldier(1)];scene.add(...actors);
  const base=new T.Mesh(new T.CylinderGeometry(.7,.76,.07,32),new T.MeshStandardMaterial({color:'#26383a',roughness:.8}));base.position.y=-.06;scene.add(base);
  const ring=new T.Mesh(new T.TorusGeometry(.67,.009,6,48),new T.MeshBasicMaterial({color:'#e3e94b'}));ring.rotation.x=Math.PI/2;ring.position.y=-.018;scene.add(ring);
  ghost=new T.Mesh(new T.BoxGeometry(.95,1.82,.55),new T.MeshBasicMaterial({color:'#9eaaa2',wireframe:true,transparent:true,opacity:.2,depthWrite:false}));ghost.position.y=.91;scene.add(ghost);
  camera=new T.PerspectiveCamera(35,1,.05,30);camera.position.set(.65,1.6,4.3);camera.lookAt(0,.9,0);return true;
 }
 return {render(host,ids,dt,team=0,motion=true){
  if(!renderer&&!init()){host.classList.add('preview-unavailable');return;}
  if(renderer.domElement.parentElement!==host)host.append(renderer.domElement);
  const width=host.clientWidth,height=host.clientHeight;if(!width||!height)return;
  if(width!==w||height!==h){w=width;h=height;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  phase+=motion?dt:0;const p={x:0,y:0,z:0,yaw:Math.PI+.2+Math.sin(phase*.5)*.12,pitch:0,cheats:ids,hp:CFG.hp,grounded:true};
  actors.forEach((a,i)=>{a.visible=i===team;if(a.visible)updateSoldier(a,p,poseParts(p),dt);});ghost.visible=ids.includes('small');renderer.render(scene,camera);
 }};
}
