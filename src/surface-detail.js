import * as T from 'three';

// Small deterministic procedural textures, shared by the arena. No downloaded assets.
export function createSurfaceDetail(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle='#f1f0eb';ctx.fillRect(0,0,256,256);
 let seed=721;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1500;i++){const value=Math.floor(110+random()*80);ctx.fillStyle=`rgba(${value},${value},${value},.09)`;ctx.fillRect(random()*256,random()*256,random()*2+1,random()*2+1);}
 ctx.fillStyle='#b8bfbc';ctx.fillRect(0,0,2,256);ctx.fillRect(0,0,256,2);
 ctx.fillStyle='#fafaf4';ctx.fillRect(2,2,1,253);ctx.fillRect(2,2,253,1);
 for(const [x,y] of [[9,9],[247,9],[9,247],[247,247]]){ctx.fillStyle='#bec5c0';ctx.fillRect(x-1,y-1,3,3);}
 const panel=new T.CanvasTexture(c);panel.wrapS=panel.wrapT=T.RepeatWrapping;panel.colorSpace=T.SRGBColorSpace;panel.anisotropy=4;
 const shade=document.createElement('canvas');shade.width=shade.height=64;const sc=shade.getContext('2d');
 // A broad soft contact patch is a decorative approximation, not screen-space AO.
 const gradient=sc.createRadialGradient(32,32,8,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.40)');gradient.addColorStop(.62,'rgba(0,0,0,.22)');gradient.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);
 const contact=new T.CanvasTexture(shade);
 return {panel,contact};
}

export function worldPanelUV(geometry,x,y,z){
 const positions=geometry.attributes.position,normals=geometry.attributes.normal,uv=geometry.attributes.uv;
 for(let i=0;i<positions.count;i++){
  const px=positions.getX(i)+x,py=positions.getY(i)+y,pz=positions.getZ(i)+z;
  if(Math.abs(normals.getY(i))>.5)uv.setXY(i,px/2,pz/2);
  else if(Math.abs(normals.getX(i))>.5)uv.setXY(i,pz/2,py/2);
  else uv.setXY(i,px/2,py/2);
 }
 uv.needsUpdate=true;
}
