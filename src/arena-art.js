import * as T from 'three';
import {VISUAL as V} from './visual-style.js';
import {createSurfaceDetail,worldPanelUV} from './surface-detail.js';

// All meshes below are decorative: BLOCKS remains the sole collision source.
export function makeArena(blocks){
 const group=new T.Group();
 const material=color=>new T.MeshStandardMaterial({color,roughness:.88});
 const mats={floor:material(V.floor),boundary:material('#596a6c'),wall:material('#6b7f7c'),cover:material('#54696b'),leg:material('#6e8068'),core:material(V.dark)};
 const surfaces=createSurfaceDetail();
 const pale=material(V.wall),yellow=material(V.yellow),teal=material(V.teal),dark=material(V.dark);
 pale.map=surfaces.panel;pale.roughness=.94;
 const panelDark=material('#354449');panelDark.map=surfaces.panel;
 const seamMat=new T.LineBasicMaterial({color:'#1c2d30',transparent:true,opacity:.27});
 function box(w,h,d,mat,x,y,z){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function label(text,w,h,x,y,z,turn=0,base=V.dark,ink=V.ivory){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,1024,256);ctx.fillStyle=ink;ctx.font='700 66px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,130,960);ctx.fillRect(40,220,944,5);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.y=turn;group.add(m);return m;
 }
 for(const [x,y,z,w,h,d,kind] of blocks){
  // Both halves use the approved treatment; geometry is still entirely BLOCKS.
  const sample=kind!=='floor'&&kind!=='boundary';
  const block=box(w,h,d,kind==='floor'?mats.floor:kind==='core'?panelDark:pale,x,y+h/2,z);
  if(kind!=='floor')worldPanelUV(block.geometry,x,y+h/2,z);
  if(sample){
   const edges=new T.LineSegments(new T.EdgesGeometry(block.geometry),seamMat);edges.position.copy(block.position);group.add(edges);
   // Thin fittings stay on the surface of the existing collision volume.
   if(kind==='cover'||kind==='core'){
    box(w+.006,.09,d+.006,dark,x,y+.045,z);
    if(w>d){for(const side of [-1,1])box(.11,h,.018,dark,x+side*(w/2-.055),y+h/2,z+d/2+.006);}
   }
   if(y===0){const shadow=new T.Mesh(new T.PlaneGeometry(w+1,d+1),new T.MeshBasicMaterial({map:surfaces.contact,transparent:true,opacity:.65,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.012,z);group.add(shadow);}
  }
  if(kind!=='floor'&&kind!=='boundary'){
   box(w+.012,.055,d+.012,sample?yellow:teal,x,y+h-.08,z);
   if(sample&&w>d){for(const edge of [-1,1])box(.07,Math.min(h,.8),d+.016,yellow,x+edge*(w/2-.12),y+Math.min(h,.8)/2,z);}
  }
 }
 const grid=new T.GridHelper(40,40,'#657475','#435156');grid.position.y=.008;grid.material.transparent=true;grid.material.opacity=.48;group.add(grid);
 // Direction markers are paint on existing walls, not new route geometry.
 const warm=material('#8e776a');
 for(const side of [-1,1]){
  const wallZ=side*19.485,turn=side>0?Math.PI:0,ink=side<0?V.teal:'#c59277';
  box(30,.45,.018,side<0?teal:warm,0,2,wallZ);
  for(const x of [-13,13])for(let h=1;h<=6;h++)label(`${h} m`,.7,.22,x,h,side*19.466,turn,V.wall,V.dark);
  label(side<0?'爆头属于低效操作':'移动 / 跳跃 / 改写规则',7,1.3,0,4.7,side*19.465,turn);
  label(side<0?'A / 实验准备区':'B / 实验准备区',4,.8,side*5,1,side*19.46,turn,V.dark,ink);
 }
 for(const side of [-1,1]){
  box(.018,.45,38,teal,side*15.485,2,0);
  label('官方外挂竞技实验',5,1,side*15.465,4.5,0,-side*Math.PI/2);
 }
 label('官方外挂 / 测试中',1.85,.6,0,1.7,1.012,0,V.dark,V.yellow);
 label('官方外挂 / 测试中',1.85,.6,0,1.7,-1.012,Math.PI,V.dark,V.yellow);
 for(const side of [-1,1]){
  const turn=side>0?Math.PI:0;
  label(side<0?'A / 机动实验区':'B / 机动实验区',3,.7,side<0?-5:5,3,side*11.66,turn);
  label('注意露腿',2.8,.5,side<0?3:-3,1.8,side*4.665,turn,V.dark,V.yellow);
  for(const z of [7,10,14]){const mark=label('↑',.65,.65,side<0?1:-1,.018,side*z,0,V.floor,V.yellow);mark.rotation.set(-Math.PI/2,0,side>0?Math.PI:0);}
  const launch=label('射地起飞 ↓',2.6,.65,side<0?-3:3,.02,side*2,0,V.floor,V.yellow);launch.rotation.set(-Math.PI/2,0,side>0?Math.PI:0);
 }
 let number=0;
 for(const [x,y,z,w,h,d,kind]of blocks){
  if(kind!=='cover')continue;const code=String(++number).padStart(2,'0');
  label(code,Math.min(.6,w*.45),.21,x,y+h-.27,z+d/2+.014,0,V.dark,V.ivory);
  label(code,Math.min(.6,w*.45),.21,x,y+h-.27,z-d/2-.014,Math.PI,V.dark,V.ivory);
 }
 return group;
}
