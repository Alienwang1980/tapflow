"use strict";
const PATTERNS={"topography":{label:"Topography",size:80,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><g fill="none" stroke="{color}" stroke-width="1.2" opacity="0.35"><path d="M0 40 Q20 30 40 40 T80 40 M0 60 Q20 50 40 60 T80 60 M0 20 Q20 10 40 20 T80 20 M0 80 Q20 70 40 80 T80 80 M0 0 Q20 -10 40 0 T80 0"/></g></svg>'},"circuit":{label:"Circuit",size:60,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><g fill="none" stroke="{color}" stroke-width="1.5" opacity="0.3"><path d="M5 5 h50 v50 h-50 z M15 15 h30 M15 25 h20 M35 15 v20 M15 40 a5 5 0 0 0 10 0 M45 25 v10 a5 5 0 0 0 10 0"/></g></svg>'},"dots":{label:"Dots",size:30,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="3" fill="{color}" opacity="0.35"/></svg>'},"diagonal":{label:"Diagonal",size:24,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><line x1="0" y1="24" x2="24" y2="0" stroke="{color}" stroke-width="1" opacity="0.2"/><line x1="-6" y1="30" x2="30" y2="-6" stroke="{color}" stroke-width="1" opacity="0.2"/></svg>'},"hexagon":{label:"Hexagon",size:60,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52"><g fill="none" stroke="{color}" stroke-width="1.2" opacity="0.28"><polygon points="30,0 60,15 60,37 30,52 0,37 0,15"/><polygon points="30,104 60,119 60,141 30,156 0,141 0,119"/><polygon points="90,0 120,15 120,37 90,52 60,37 60,15"/><polygon points="-30,0 0,15 0,37 -30,52 -60,37 -60,15"/></g></svg>'},"grid":{label:"Grid",size:40,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><line x1="0" y1="20" x2="40" y2="20" stroke="{color}" stroke-width="0.8" opacity="0.2"/><line x1="20" y1="0" x2="20" y2="40" stroke="{color}" stroke-width="0.8" opacity="0.2"/></svg>'},"triangles":{label:"Triangles",size:60,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52"><g fill="none" stroke="{color}" stroke-width="1" opacity="0.25"><polygon points="30,0 60,52 0,52"/><polygon points="90,0 120,52 60,52"/><polygon points="-30,0 0,52 -60,52"/></g></svg>'},"topo":{label:"Topography",size:1000,img:"topography.svg"},"waves":{label:"Waves",size:40,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><g fill="none" stroke="{color}" stroke-width="1.2" opacity="0.3"><path d="M0 15 Q10 5 20 15 T40 15 M0 30 Q10 20 20 30 T40 30"/></g></svg>'}};
function _patCSS(pid,color,sz){if(!pid||pid==="none")return"";var p=PATTERNS[pid];if(!p)return"";var s=sz||p.size;return'background-image:url("data:image/svg+xml,'+encodeURIComponent(p.svg.replace(/\{color\}/g,color))+'");background-size:'+s+'px '+s+'px'}function _patIMG(pid){if(!pid||pid==="none")return null;var p=PATTERNS[pid];if(!p||!p.img)return null;return p}
function hesc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
let ws=null,profile=null,profiles=[],activePage="",activeProfile="Default.json";
let selKey=null,selKeys=new Set(),selGroup=null,dirty=false,profileLoaded=false;
let panX=0,panY=0,panning=false,panStartX=0,panStartY=0,mx=0,my=0,copiedStyle=null;
let selecting=false,srSX=0,srSY=0,srCX=0,srCY=0;
let undoStack=[],redoStack=[];
const MAX_UNDO=200;
const DEVS={"iPad 4:3":{w:1024,h:1366},"iPad 11\"":{w:834,h:1210},"iPad mini":{w:744,h:1133},"Android 16:10":{w:1280,h:800}};

// ── Undo/Redo ──
function _snapshot(k){return{id:k.id,col:k.col,row:k.row,w:k.w,h:k.h,label:k.label,action:k.action,value:k.value,color:k.color,sound:k.sound,groups:k.groups?k.groups.slice():null}}
function _pushUndo(keysBefore){
  const page=cp_();if(!page)return;
  const after=keysBefore.map(b=>{const k=page.keys.find(x=>x.id===b.id);return k?_snapshot(k):null}).filter(Boolean);
  undoStack.push({before:keysBefore.map(b=>({...b})),after,ts:Date.now()});
  if(undoStack.length>MAX_UNDO)undoStack.shift();
  redoStack=[];
}
function undo(){
  if(!undoStack.length)return;
  const e=undoStack.pop();
  const page=cp_();if(!page)return;
  e.before.forEach(b=>{const k=page.keys.find(x=>x.id===b.id);if(k){Object.assign(k,b)}else{page.keys.push({...b})}});
  const bid=new Set(e.before.map(b=>b.id));
  const toDel=page.keys.filter(k=>!bid.has(k.id)&&e.after.some(a=>a.id===k.id));
  toDel.forEach(k=>{page.keys=page.keys.filter(x=>x.id!==k.id)});
  redoStack.push(e);dirty=true;
  selKey=e.before.length===1?e.before[0].id:null;selKeys.clear();e.before.forEach(b=>selKeys.add(b.id));
  rr();rpr();
}
function redo(){
  if(!redoStack.length)return;
  const e=redoStack.pop();
  const page=cp_();if(!page)return;
  e.after.forEach(a=>{const k=page.keys.find(x=>x.id===a.id);if(k){Object.assign(k,a)}else{page.keys.push({...a})}});
  const aid=new Set(e.after.map(a=>a.id));
  const toDel=page.keys.filter(k=>!aid.has(k.id)&&e.before.some(b=>b.id===k.id));
  toDel.forEach(k=>{page.keys=page.keys.filter(x=>x.id!==k.id)});
  undoStack.push(e);dirty=true;
  selKey=e.after.length===1?e.after[0].id:null;selKeys.clear();e.after.forEach(a=>selKeys.add(a.id));
  rr();rpr();
}