import CFG from './generated-balance.js';
export const SETTINGS_KEY='limblab-settings-v1';
export const DEFAULT_SETTINGS={sensitivity:CFG.mouseSensitivity,aimSensitivity:.75,effects:1,fov:CFG.fov,volume:.75,footsteps:1.5,shake:.4};
export const SETTINGS_BOUNDS={sensitivity:[.0002,.012],aimSensitivity:[.1,2],effects:[0,1],fov:[50,110],volume:[0,1],footsteps:[0,3],shake:[0,1]};
export function sanitizeSettings(data={}){const out={...DEFAULT_SETTINGS};for(const [k,[lo,hi]]of Object.entries(SETTINGS_BOUNDS))if(typeof data[k]==='number'&&Number.isFinite(data[k]))out[k]=Math.max(lo,Math.min(hi,data[k]));return out;}
export function loadSettings(storage){try{return sanitizeSettings(JSON.parse(storage.getItem(SETTINGS_KEY)||'{}'));}catch{return {...DEFAULT_SETTINGS};}}
export function saveSettings(storage,data){const settings=sanitizeSettings(data);try{storage.setItem(SETTINGS_KEY,JSON.stringify(settings));return true;}catch{return false;}}
