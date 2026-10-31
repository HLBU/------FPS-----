import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import WebSocket from 'ws';

test('Aliyun entry authenticates assets and relays an isolated two-player room',async t=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'pipe',windowsHide:true});
 const port=15189,base=`http://127.0.0.1:${port}/fps/v20261031/`;
 const child=spawn(process.execPath,['scripts/aliyun-server.mjs'],{env:{...process.env,PORT:String(port),GAME_TEST_CODE:'test-only'}});
 t.after(()=>child.kill());await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited');}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Server start timeout')),10000).unref())]);
 assert.equal((await fetch(base)).status,403);
 assert.equal((await fetch(base+'?code=wrong')).status,403);
 const entry=await fetch(base+'?code=test-only');assert.equal(entry.status,200);const html=await entry.text();assert.match(html,/FPS_RELAY=true/);assert.match(html,/src="\/fps\/v20261031\/client.js"/);
 const cookie=entry.headers.get('set-cookie').split(';')[0];const headers={Cookie:cookie};
 assert.equal((await fetch(base+'client.js',{headers})).status,200);
 assert.equal((await fetch(base+'health',{headers})).status,200);
 assert.equal((await fetch(base+'?code=wrong',{headers})).status,403);
 const connect=async()=>{const ws=new WebSocket(base.replace('http:','ws:')+'relay',{headers:{...headers,Origin:`http://127.0.0.1:${port}`}});t.after(()=>ws.terminate());await once(ws,'open');return ws;};
 const host=await connect(),guest=await connect();
 let message=once(host,'message');host.send(JSON.stringify({id:1,type:'host'}));const {code}=JSON.parse((await message)[0]);assert.match(code,/^[A-Z2-9]{6}$/);
 const joined=once(guest,'message'),ready=once(host,'message');guest.send(JSON.stringify({id:2,type:'join',code}));assert.equal(JSON.parse((await joined)[0]).id,2);assert.equal(JSON.parse((await ready)[0]).type,'connected');
 message=once(guest,'message');host.send(JSON.stringify({type:'data',data:{type:'state',tick:42}}));assert.deepEqual(JSON.parse((await message)[0]),{type:'data',data:{type:'state',tick:42}});
 message=once(host,'message');guest.send(JSON.stringify({type:'data',data:{type:'input',dashSeq:1}}));assert.equal(JSON.parse((await message)[0]).data.dashSeq,1);
 message=once(host,'message');guest.close();assert.equal(JSON.parse((await message)[0]).type,'left');
});
