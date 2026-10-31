import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game,poseParts,lockTarget} from '../src/game.js';
import {aimFeedback,penetrationSurfaces} from '../src/ability-feedback.js';
import {makeSoldier,updateSoldier} from '../src/soldier.js';
import {createCombatArt} from '../src/combat-art.js';

test('aim feedback follows legal limb lock and never identifies an occluded limbless target',()=>{
 const g=new Game(),[p,q]=g.players;Object.assign(p,{x:12,z:4,yaw:0,pitch:0,cheats:['aim']});Object.assign(q,{x:12,z:-4});
 assert.deepEqual(aimFeedback(p,q),{mode:'locked',point:lockTarget(p,q)});
 q.cheats=['limbless'];assert.equal(aimFeedback(p,q).mode,'no-limbs');
 Object.assign(p,{x:0,z:8});Object.assign(q,{x:0,z:-8});assert.equal(aimFeedback(p,q).mode,'search');
 p.pitch=-1.5;assert.equal(aimFeedback(p,q).mode,'lift');p.pitch=0;p.cheats=[];assert.equal(aimFeedback(p,q).mode,'idle');
});

test('penetration markers identify distinct entry/exit surfaces and exclude arena boundary',()=>{
 const surfaces=penetrationSurfaces([0,1,8],[0,1,-8]);assert.equal(surfaces.length,2);
 assert.deepEqual(surfaces.map(s=>s.normal),[[0,0,1],[0,0,-1]]);
 assert.ok(Math.abs(surfaces[0].at[2]-1.018)<1e-6);assert.ok(Math.abs(surfaces[1].at[2]+1.018)<1e-6);
 assert.deepEqual(penetrationSurfaces([14,1,0],[20,1,0]),[]);
 assert.deepEqual(penetrationSurfaces([0,0,0],[0,0,0]),[]);
});

test('repair and supply visuals respect health changes, limb removal and per-player isolation',()=>{
 const g=new Game(),p=g.players[0],a=makeSoldier(0),b=makeSoldier(1);p.cheats=['regen','infinite','limbless'];p.hp=100;
 updateSoldier(a,p,poseParts(p),.016);assert.equal(a.userData.repair.visible,false);
 p.hp=110;updateSoldier(a,p,poseParts(p),.016);assert.equal(a.userData.repair.visible,true);assert.equal(b.userData.repair.visible,false);
 assert.equal(a.userData.gun.userData.supply.visible,true);assert.equal(a.userData.gun.userData.hands.visible,false);
 assert.ok(a.userData.parts.slice(2).every(part=>!part.visible));
 updateSoldier(a,p,poseParts(p),.016,0);assert.equal(a.userData.repair.visible,false);
 p.cheats=[];p.reload=.5;p.reloadDuration=1;updateSoldier(a,p,poseParts(p),.016);assert.ok(a.userData.gun.userData.support.position.y<0);
 p.reload=0;updateSoldier(a,p,poseParts(p),.016);assert.ok(Math.abs(a.userData.gun.userData.support.position.y)<1e-8);assert.equal(a.userData.gun.userData.supply.visible,false);
});

test('persistent movement and wall markers stay bounded and disappear when effects are disabled',()=>{
 const scene=new T.Scene(),fx=createCombatArt(scene),camera=new T.PerspectiveCamera();
 for(let i=0;i<100;i++){fx.speed([0,0,0],0,1);fx.pierce(penetrationSurfaces([0,1,8],[0,1,-8]),1);}
 assert.ok(scene.children.length<=44);fx.update(.01,camera,0);assert.equal(scene.children.length,0);
 fx.land([0,0,0],1);fx.clear();assert.equal(scene.children.length,0);
});
