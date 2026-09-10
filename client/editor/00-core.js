function _hexToRgba(h,a){if(!h||h==="inherit"||h.charAt(0)!=="#")return null;var x=h.replace("#","");if(x.length===3)x=x[0]+x[0]+x[1]+x[1]+x[2]+x[2];var r=parseInt(x.slice(0,2),16),g=parseInt(x.slice(2,4),16),b=parseInt(x.slice(4,6),16);return isNaN(r)?null:"rgba("+r+","+g+","+b+","+a+")"}
// ── Auto text color: same hue as bg, flipped lightness, desaturated; gray bg → neutral; semi-transparent bg composited over page bg ──
function _autoFc(hx,op,pgbg){var r=15,g=15,b=15;if(hx&&hx.charAt(0)==="#"){var x=hx.replace("#","");if(x.length===3)x=x[0]+x[0]+x[1]+x[1]+x[2]+x[2];if(x.length===6){r=parseInt(x.slice(0,2),16);g=parseInt(x.slice(2,4),16);b=parseInt(x.slice(4,6),16);if(op!==undefined&&op<1){var pr=15,pg=15,pb=15;if(pgbg&&pgbg.charAt(0)==="#"){var y=pgbg.replace("#","");if(y.length===3)y=y[0]+y[0]+y[1]+y[1]+y[2]+y[2];if(y.length===6){pr=parseInt(y.slice(0,2),16);pg=parseInt(y.slice(2,4),16);pb=parseInt(y.slice(4,6),16)}}r=Math.round(r*op+pr*(1-op));g=Math.round(g*op+pg*(1-op));b=Math.round(b*op+pb*(1-op))}}}r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,s=0,h=0;if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}if(s<0.08)return l<0.5?"hsl(0,0%,88%)":"hsl(0,0%,18%)";if(l<0.5)return "hsl("+h.toFixed(0)+","+(s*55).toFixed(0)+"%,88%)";return "hsl("+h.toFixed(0)+","+(s*75).toFixed(0)+"%,18%)"}

"use strict";
const PATTERNS={"topography":{label:"Topography",size:24,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><g fill="none" stroke="{color}" stroke-width="1.6" opacity="0.30"><path d="M0 8 Q6 12 12 8 T24 10 M0 14 Q6 10 12 14 T24 12 M0 19 Q6 23 12 19 T24 21"/></g></svg>'},"circuit":{label:"Circuit",size:60,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><g fill="none" stroke="{color}" stroke-width="1.5" opacity="0.3"><path d="M5 5 h50 v50 h-50 z M15 15 h30 M15 25 h20 M35 15 v20 M15 40 a5 5 0 0 0 10 0 M45 25 v10 a5 5 0 0 0 10 0"/></g></svg>'},"dots":{label:"Dots",size:30,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><circle cx="15" cy="15" r="3" fill="{color}" opacity="0.35"/></svg>'},"diagonal":{label:"Diagonal",size:24,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><g fill="none" stroke="{color}" stroke-width="1" opacity="0.2"><line x1="0" y1="24" x2="24" y2="0"/><line x1="0" y1="6" x2="6" y2="0"/><line x1="6" y1="24" x2="24" y2="6"/></g></svg>'},"hexagon":{label:"Hexagon",size:60,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52"><g fill="none" stroke="{color}" stroke-width="1.2" opacity="0.28"><path d="M0,34.64 L30,17.32 M30,17.32 L30,0 M30,17.32 L60,34.64 M0,52 L0,34.64"/></g></svg>'},"grid":{label:"Grid",size:40,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><line x1="0" y1="20" x2="40" y2="20" stroke="{color}" stroke-width="0.8" opacity="0.2"/><line x1="20" y1="0" x2="20" y2="40" stroke="{color}" stroke-width="0.8" opacity="0.2"/></svg>'},"triangles":{label:"Triangles",size:60,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="60" height="52"><g fill="none" stroke="{color}" stroke-width="1" opacity="0.25"><path d="M30,0 L60,52 M0,52 L30,0 M60,0 L30,0 M0,0 L0,52 M30,0 L0,0"/></g></svg>'},"topo":{label:"Topo Texture",size:1000,img:"topography.svg"},"waves":{label:"Waves",size:40,svg:'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><g fill="none" stroke="{color}" stroke-width="1.2" opacity="0.3"><path d="M0 15 Q10 5 20 15 T40 15 M0 30 Q10 20 20 30 T40 30"/></g></svg>'}};
function _patCSS(pid,color,sz){if(!pid||pid==="none")return"";var p=PATTERNS[pid];if(!p)return"";var s=sz||p.size;return'background-image:url("data:image/svg+xml,'+encodeURIComponent(p.svg.replace(/\{color\}/g,color))+'");background-size:'+s+'px '+s+'px'}function _patIMG(pid){if(!pid||pid==="none")return null;var p=PATTERNS[pid];if(!p||!p.img)return null;return p}
function hesc(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&#39;").replace(/\\/g,"&#92;")}
let ws=null,profile=null,profiles=[],activePage="",activeProfile="Default.json";
let selKey=null,selKeys=new Set(),selGroup=null,dirty=false,profileLoaded=false,_wsOk=false;
// Save & Sync 按钮状态: 内容与已落盘快照一致=禁用;300ms debounce 防拖拽热路径高频 stringify
// 比较前 keys 按 id 排序规范化 — undo 恢复被删键是 push 末尾(顺序与保存时不同但内容等价),顺序不参与判定
let _lastTapT=0,_lastTapKid=null;
var _gFont="";var _gBalCur="CNY";function _gf(){return _gFont?"'"+_gFont+"'":"-apple-system,sans-serif"}fetch("/api/config").then(r=>r.json()).then(c=>{var f=c.fontFamily||"",cu=c.balanceCurrency||"CNY";if(f!==_gFont||cu!==_gBalCur){_gFont=f;_gBalCur=cu;if(profileLoaded)renderAll()}}).catch(function(){});
// ── Save & Sync 按钮状态 ──
// 与 _savedSnap(上次载入/落盘时的规范化快照)比较,一致=禁用。
// keys/groups 按 id 排序规范化 — 顺序不参与判定。300ms debounce 防拖拽热路径高频 stringify。
let _savedSnap=null,_dirtyT=null;
// 注意: 本块定义在 let panX/viewX 之前;解析期唯一调用 _refreshSaveBtn() 靠 !!profile 短路不会触达它们
function _normSig(p,fn){if(!p)return null;var c=JSON.parse(JSON.stringify(p));(c.pages||[]).forEach(function(pg){(pg.keys||[]).sort(function(a,b){return a.id<b.id?-1:a.id>b.id?1:0})});(c.groups||[]).sort(function(a,b){return a.id<b.id?-1:a.id>b.id?1:0});delete c._filename;if(fn)c._filename=fn;return JSON.stringify(c)}
function _profSig(noFn){if(!profile)return null;var p=JSON.parse(JSON.stringify(profile));p.canvasX=panX;p.canvasY=panY;p.viewX=viewX;p.viewY=viewY;p.viewZoom=viewZoom;return _normSig(p,noFn?null:activeProfile)}
function _setDirty(){dirty=true;if(_dirtyT)clearTimeout(_dirtyT);_dirtyT=setTimeout(_refreshSaveBtn,300)}
function _refreshSaveBtn(){var b=document.getElementById("btnSave");if(!b)return;var isDirty=!!profile&&(_savedSnap===null||(dirty&&_profSig()!==_savedSnap));if(profile&&_savedSnap!==null)dirty=isDirty;b.disabled=!isDirty||!_wsOk;b.title=_wsOk?"":"Server not connected";b.classList.toggle("dirty",isDirty);b.textContent=isDirty?"● Save & Sync":"Save & Sync"}
function _markClean(){dirty=false;_savedSnap=_profSig();_refreshSaveBtn()}
_refreshSaveBtn();
let panX=0,panY=0,panning=false,panStartX=0,panStartY=0,mx=0,my=0,panShiftLock=null,copiedStyle=null;
let viewX=0,viewY=0,viewZoom=1;
let selecting=false,srSX=0,srSY=0,srCX=0,srCY=0;
let undoStack=[],redoStack=[];
const MAX_UNDO=200;
const DEVS={"iPad 11\"":{w:834,h:1194,dpr:2,topInset:32,phys:"1668×2388",portrait:false},"iPad 12.9\"":{w:1024,h:1366,dpr:2,topInset:32,phys:"2048×2732",portrait:false},"iPhone (19.5:9)":{w:430,h:932,dpr:3,topInset:59,phys:"1290×2796",portrait:true},"16:10":{w:1280,h:800,dpr:1,topInset:0,phys:"",portrait:false},"16:9":{w:675,h:1200,dpr:1,topInset:0,phys:"",portrait:false},"21:9":{w:514,h:1200,dpr:1,topInset:0,phys:"",portrait:false}};

// ── Undo/Redo ──
function _snapshot(k){return JSON.parse(JSON.stringify(k))}
function _pushUndo(keysBefore,keysAfter,groupsBefore,groupsAfter){
  const page=cp_();if(!page)return;
  const after=keysAfter?keysAfter.map(a=>_snapshot(a)):keysBefore.map(b=>{const k=page.keys.find(x=>x.id===b.id);return k?_snapshot(k):null}).filter(Boolean);
  const e={before:keysBefore.map(b=>({...b})),after,ts:Date.now()};
  if(groupsBefore!==undefined){e.groupsBefore=JSON.parse(JSON.stringify(groupsBefore));e.groupsAfter=JSON.parse(JSON.stringify(groupsAfter))}
  undoStack.push(e);
  if(undoStack.length>MAX_UNDO)undoStack.shift();
  redoStack=[];
}
function _flushLiveBase(){if(!_liveBase)return;var b=_liveBase;_liveBase=null;var page=cp_();if(!page)return;var cur=b.kid==="*"?page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k)):[page.keys.find(x=>x.id===b.kid)].filter(Boolean).map(k=>_snapshot(k));if(JSON.stringify(b.before)!==JSON.stringify(cur))_pushUndo(b.before)}
function undo(){
  _flushLiveBase();
  if(!undoStack.length)return;
  const e=undoStack.pop();
  const page=cp_();if(!page)return;
  e.before.forEach(b=>{const k=page.keys.find(x=>x.id===b.id);if(k){Object.keys(k).forEach(function(p){if(!Object.prototype.hasOwnProperty.call(b,p))delete k[p]});Object.assign(k,b)}else{page.keys.push({...b})}});
  const bid=new Set(e.before.map(b=>b.id));
  const toDel=page.keys.filter(k=>!bid.has(k.id)&&e.after.some(a=>a.id===k.id));
  toDel.forEach(k=>{page.keys=page.keys.filter(x=>x.id!==k.id)});
  if(e.groupsBefore!==undefined)profile.groups=JSON.parse(JSON.stringify(e.groupsBefore));
  redoStack.push(e);_setDirty();
  selKey=e.before.length===1?e.before[0].id:null;selKeys.clear();e.before.forEach(b=>selKeys.add(b.id));
  rr();rpr();rgrp();
}
function redo(){
  if(!redoStack.length)return;
  const e=redoStack.pop();
  const page=cp_();if(!page)return;
  e.after.forEach(a=>{const k=page.keys.find(x=>x.id===a.id);if(k){Object.assign(k,a)}else{page.keys.push({...a})}});
  const aid=new Set(e.after.map(a=>a.id));
  const toDel=page.keys.filter(k=>!aid.has(k.id)&&e.before.some(b=>b.id===k.id));
  toDel.forEach(k=>{page.keys=page.keys.filter(x=>x.id!==k.id)});
  if(e.groupsAfter!==undefined)profile.groups=JSON.parse(JSON.stringify(e.groupsAfter));
  undoStack.push(e);_setDirty();
  selKey=e.after.length===1?e.after[0].id:null;selKeys.clear();e.after.forEach(a=>selKeys.add(a.id));
  rr();rpr();rgrp();
}
