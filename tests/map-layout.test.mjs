import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,BLOCKS,CFG,findPath,wallDistance} from '../src/game.js';

test('opened side-wall ends allow a full dash in both mirror directions and every stance',()=>{
 for(const mirror of [-1,1])for(const stance of [0,1,2]){
  const g=new Game(),p=g.players[0];g.stage='fight';
  Object.assign(p,{x:-11*mirror,z:-6.5*mirror,y:0,stance,grounded:true});
  g.input(0,{forward:1,yaw:-Math.PI/2*mirror,dashSeq:1,crouch:stance===1,prone:stance===2});
  for(let i=0;i<12;i++)g.move(p,1/60);
  assert.ok(Math.abs(p.x-(-11+CFG.dashDistance)*mirror)<1e-6);
  assert.equal(p.stance,stance);
  assert.equal(g.events.find(e=>e.type==='dashEnd')?.blocked,false);
 }
});

test('transfer cover stops ground dashes but can be passed above and penetrated by bullets',()=>{
 for(const height of [0,3]){
  const g=new Game(),p=g.players[0];g.stage='fight';Object.assign(p,{x:-6,z:3,y:height,grounded:height===0});
  g.input(0,{forward:1,dashSeq:1});for(let i=0;i<12;i++)g.move(p,1/60);
  if(height===0){assert.ok(p.z>=.25-1e-6);assert.equal(g.events.find(e=>e.type==='dashEnd')?.blocked,true);}
  else {assert.ok(Math.abs(p.z+2)<1e-6);assert.equal(g.events.find(e=>e.type==='dashEnd')?.blocked,false);}
 }
 const origin=[-6,.5,3],ray=[0,0,-1];assert.ok(wallDistance(origin,ray)<4);
 assert.ok(wallDistance(origin,ray,true)>20);
});

test('bot navigation connects both spawn areas without walking through new ground cover',()=>{
 for(const mirror of [-1,1]){
  const from=[-5*mirror,16*mirror],to=[5*mirror,-16*mirror],path=findPath(from,to);
  assert.deepEqual(path.at(-1),to);
  let previous=from;
  for(const node of path){
   for(let t=0;t<=1;t+=.1){const x=previous[0]+(node[0]-previous[0])*t,z=previous[1]+(node[1]-previous[1])*t;
    assert.ok(!BLOCKS.some(([bx,y,bz,w,h,d,kind])=>kind!=='floor'&&y<1.8&&y+h>.1&&Math.abs(x-bx)<w/2+.30&&Math.abs(z-bz)<d/2+.30));
   }
   previous=node;
  }
 }
});
