import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import WebSocket from 'ws';
import {attachGameServer} from '../src/authoritative-server.mjs';
import {Game,CFG,eye,poseParts,bodyShape} from '../src/game.js';
import {ClientSync,DashConfirmation,shoulderFov} from '../src/client-sync.js';

const fight=()=>{const g=new Game({rng:()=>.5});g.stage='fight';Object.assign(g.players[0],{x:12,z:4,cheats:['infinite']});Object.assign(g.players[1],{x:-12,z:0});return g;};
test('remainder preserves 480 RPM at 30, 60 and 120 Hz; slow frames keep simulation time',()=>{
 for(const dt of [1/30,1/60,1/120,.1]){const g=fight();g.input(0,{fire:true});let shots=0;for(let n=0;n<Math.round(10/dt);n++){const before=g.eid;g.tick(dt);shots+=g.events.filter(e=>e.id>before&&e.type==='shot').length;}assert.equal(shots,80);assert.ok(Math.abs(g.time-65)<1e-7);}
 const g=fight();g.tick(1);assert.ok(g.time>=74.5,'long stalls catch up at most half a second');g.tick(NaN);assert.ok(Number.isFinite(g.time));
});
test('stance changes share 0.18 second eye, silhouette and hitbox transition, with conservative collision',()=>{
 const g=fight(),p=g.players[0],before=eye(p)[1];g.input(0,{prone:true});g.move(p,1/60);assert.equal(p.stance,2);assert.ok(eye(p)[1]>.4&&eye(p)[1]<before);assert.ok(poseParts(p)[0].c[1]>.34);assert.equal(bodyShape(p).height,1.82);for(let n=0;n<11;n++)g.move(p,1/60);assert.equal(eye(p)[1],.4);assert.equal(bodyShape(p).height,.55);
});
test('optical magnification remains exactly 1.15 across user FOVs',()=>{for(const fov of [50,78,110])assert.ok(Math.abs(Math.tan(fov*Math.PI/360)/Math.tan(shoulderFov(fov)*Math.PI/360)-1.15)<1e-10);});
test('prediction replays unacknowledged movement, authoritative ammo remains untouched; dash confirms only once',()=>{
 const g=fight(),sync=new ClientSync(),state={...g.snapshot(),ack:0,roundKey:0,serverTime:0};sync.accept(state,0);const a=sync.command({forward:1,dashSeq:1});assert.ok(sync.predicted.dash>0);assert.equal(sync.predicted.ammo,30);g.input(0,a.input);g.tick(1/60);sync.accept({...g.snapshot(),ack:a.seq,roundKey:0,serverTime:1/60},0);assert.equal(sync.pending.length,0);assert.ok(Math.abs(sync.predicted.z-g.players[0].z)<1e-8);sync.command({forward:1});g.newRound();sync.accept({...g.snapshot(),ack:1,roundKey:1,serverTime:1},0);assert.equal(sync.pending.length,0);
 const fx=new DashConfirmation();fx.predict(1,0);assert.equal(fx.confirm({seq:1}),true);assert.equal(fx.confirm({seq:1}),true);fx.predict(2,1);assert.equal(fx.expired(1.5),false);assert.equal(fx.expired(1.7),true);assert.equal(fx.confirm({seq:2}),true);
});
test('server bounds target rewinding while applying damage to present-day health',()=>{const g=fight(),[p,q]=g.players;p.cheats=['aim'];Object.assign(q,{x:12,z:-4});const historical=structuredClone(q);q.x=-12;g.rewindTarget=()=>historical;p.rewindAge=.1;g.shoot(p);assert.equal(q.hp,350);assert.equal(historical.hp,400);g.rewindTarget=null;g.shoot(p);assert.equal(q.hp,350);});
test('two actual WebSocket clients receive only their own draft, cannot forge state, and both must confirm next round',async t=>{
 const server=http.createServer(),arena=attachGameServer(server,{path:'/arena'});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{arena.close();server.close();});const url=`ws://127.0.0.1:${server.address().port}/arena`;
 const connect=async()=>{const ws=new WebSocket(url);t.after(()=>ws.terminate());ws.messages=[];ws.on('message',raw=>ws.messages.push(JSON.parse(raw)));await once(ws,'open');return ws;};
 const until=async(fn)=>{const start=Date.now();while(Date.now()-start<3000){const value=fn();if(value)return value;await new Promise(r=>setTimeout(r,10));}throw Error('timed out waiting for authoritative message');};
 const host=await connect(),guest=await connect();host.send(JSON.stringify({type:'host',id:1}));const {code}=await until(()=>host.messages.find(m=>m.id===1));const room=arena.rooms.get(code);room.game.offers=[['esp','aim','wall'],['silent','third','regen']];guest.send(JSON.stringify({type:'join',id:2,code}));
 const a=(await until(()=>host.messages.find(m=>m.type==='state'))).state,b=(await until(()=>guest.messages.find(m=>m.type==='state'))).state;assert.deepEqual(a.offers,['esp','aim','wall']);assert.deepEqual(b.offers,['silent','third','regen']);assert.ok(!JSON.stringify(a).includes('silent'));assert.ok(!JSON.stringify(b).includes('esp'));
 host.send(JSON.stringify({type:'state',state:{stage:'over',score:[3,0]}}));host.send(JSON.stringify({type:'choose',ids:['esp','aim']}));guest.send(JSON.stringify({type:'choose',ids:['silent','regen']}));await until(()=>room.game.stage==='prepare');assert.deepEqual(room.game.score,[0,0]);assert.equal(room.game.players[0].hp,400);
 room.game.stage='fight';Object.assign(room.game.players[0],{x:12,z:4});host.send(JSON.stringify({type:'input',seq:1,roundKey:0,input:{forward:1,sprint:true,yaw:0,hp:9999,x:0}}));await until(()=>room.acks[0]===1);assert.ok(room.game.players[0].z<4);assert.equal(room.game.players[0].hp,400);assert.ok(room.game.players[0].rewindAge<=CFG.lagCompensation);
 room.game.finish(0,'test');host.send(JSON.stringify({type:'next'}));await until(()=>room.nextReady[0]);assert.equal(room.game.stage,'result');guest.send(JSON.stringify({type:'next'}));await until(()=>room.epoch===1);assert.equal(room.game.stage,'select');host.send(JSON.stringify({type:'input',seq:2,roundKey:0,input:{dashSeq:99}}));await new Promise(r=>setTimeout(r,30));assert.equal(room.queues[0].length,0);
});
