import {CFG} from './game.js';
const paths={
 esp:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 aim:'<circle cx="12" cy="12" r="6"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
 wall:'<path d="M10 3v18m4-18v18M2 12h20m-5-5 5 5-5 5"/>',
 silent:'<path d="M6 9h4l5-4v14l-5-4H6Zm13 0 4 6m0-6-4 6"/>',
 third:'<circle cx="8" cy="8" r="3"/><path d="M3 21v-6a5 5 0 0 1 10 0v6m3-15h5v12h-5m0-6h5"/>',
 speed:'<path d="m3 5 7 7-7 7m9-14 7 7-7 7m6-14h4m-4 14h4"/>',
 limbless:'<circle cx="12" cy="5" r="3"/><path d="M8 11h8v9H8Zm-4 1H2m20 0h-2M9 23v-1m6 1v-1"/>',
 infinite:'<path d="M12 12c-6-11-15 2-7 5 4 2 6-4 7-5 6-11 15 2 7 5-4 2-6-4-7-5Z"/>',
 regen:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
 small:'<path d="M3 9V3h6m6 0h6v6m0 6v6h-6M9 21H3v-6m6-6h6v6H9Z"/>',
};
export const CHEAT_UI={
 esp:{type:'侦察',short:'看见墙后对手'},aim:{type:'辅助',short:'锁定可见四肢'},
 wall:{type:'攻击',short:'贯穿内部墙体与掩体'},silent:{type:'隐匿',short:'无脚步，同时反制透视'},
 third:{type:'视角',short:'切换肩后第三人称'},speed:{type:'机动',short:`疾跑速度 ×${CFG.speedMultiplier}`},
 limbless:{type:'防御',short:'移除四肢与对应受击区域'},infinite:{type:'武器',short:'弹匣不消耗'},
 regen:{type:'恢复',short:`每秒恢复 ${CFG.regen} 生命`},small:{type:'体型',short:`缩小至 ${Math.round(CFG.smallScale*100)}%`},
};
export const cheatIcon=id=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]||paths.aim}</svg>`;
export function matchHighlight(stats){return stats.throughDamage>0?`你的记录 · 穿墙伤害 ${stats.throughDamage}`:stats.limbHits>0?`你的记录 · 四肢命中 ${stats.limbHits} 次`:stats.hits>0?`你的记录 · 命中 ${stats.hits} 次`:'';}
