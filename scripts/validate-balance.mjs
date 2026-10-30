import {parseBalance} from './balance.mjs';
let text='';for await(const chunk of process.stdin)text+=chunk;
try{const config=parseBalance(text);console.log(`配表校验通过：回血 ${config.regen}/秒，移速 ${config.speed*config.speedMultiplier} 米/秒。`);}catch(e){console.error(e.message);process.exitCode=1;}
