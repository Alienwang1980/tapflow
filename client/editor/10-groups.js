// ── Group/Ungroup ──
function groupSelected(){
  if(selKeys.size<2)return;
  const page=cp_();if(!page)return;
  const before=page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k));
  const gid="g_"+Date.now();
  if(!profile.groups)profile.groups=[];
  profile.groups.push({id:gid,name:"Group "+(profile.groups.length+1)});
  
  _pushUndo(before);dirty=true;rr();rpr();
}
function rgrp(){const groups=profile?.groups||[];document.getElementById("grpl").innerHTML=groups.length?groups.map(g=>"<div class=\"it\" onclick=\"selectGroup('"+g.id+"')\">"+hesc(g.name)+"<span class=\"x\" onclick=\"event.stopPropagation();ungroupById('"+g.id+"')\">✕</span></div>").join(""):"<p style=\"font-size:10px;color:var(--dim)\">Select keys → Save as Group</p>";}function saveAsGroup(){var name=prompt("Group name:","Group "+((profile.groups?.length||0)+1));if(!name||!name.trim())return;var gid="g_"+Date.now();if(!profile.groups)profile.groups=[];profile.groups.push({id:gid,name:name.trim()});var page=cp_();if(!page)return;var before=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});page.keys.forEach(function(k){if(selKeys.has(k.id)){if(!k.groups)k.groups=[];if(k.groups.indexOf(gid)<0)k.groups.push(gid)}});_pushUndo(before);dirty=true;renderAll();}
function selectGroup(gid){selGroup=gid;selKeys.clear();selKey=null;cp_().keys.forEach(k=>{if(k.groups&&k.groups.indexOf(gid)>=0)selKeys.add(k.id)});rr();rpr();rgrp();}
let mT=[],mM=1,mTK=null;function openMM(kid){mTK=kid;mT=[];var k=cp_()?.keys.find(function(x){return x.id===kid});var lbl=document.getElementById("mkl");if(lbl)lbl.textContent="Assigning: "+(k?k.label:kid)+(k&&k.value?" (current: "+k.value+")":"");renderMT();document.getElementById("macroModal").style.display="flex";document.getElementById("mtc").focus()}function closeMM(){document.getElementById("macroModal").style.display="none";mT=[];mTK=null}function setMM(m){mM=m;document.getElementById("mcb").style.background=m===1?"var(--accent)":"var(--card)";document.getElementById("msq").style.background=m===2?"var(--accent)":"var(--card)";document.getElementById("mcb").style.color=m===1?"#fff":"var(--text)";document.getElementById("msq").style.color=m===2?"#fff":"var(--text)"}function addMT(key){mT.push(key);renderMT()}function renderMT(){document.getElementById("mtc").innerHTML=(mT.length===0?"<span style=color:var(--dim);font-size:11px>Click here and type keys, or click modifiers...</span>":"")+mT.map(function(k,i){return"<span data-mi="+i+" style=background:var(--card);padding:3px 8px;border-radius:3px;font-size:12px;display:inline-flex;align-items:center;gap:4px>"+k+"<span onclick=removeMT("+i+") style=cursor:pointer;color:var(--red);margin-left:4px>x</span></span>"}).join("")}function removeMT(i){mT.splice(i,1);renderMT()}function saveMacro(){var v=mT.join("+");var k=cp_()?.keys.find(function(x){return x.id===mTK});if(k){var b=_snapshot(k);k.value=v;k.action="macro";if(JSON.stringify(b)!==JSON.stringify(_snapshot(k)))_pushUndo([b])}closeMM();dirty=true;rr();rpr()}document.addEventListener("keydown",function(e){var mm=document.getElementById("macroModal");if(!mm||mm.style.display!=="flex")return;if(e.key==="Escape")return;e.preventDefault();e.stopPropagation();// Map physical keys with left/right distinction
var _km={Enter:"ENTER",Tab:"TAB"," ":"SPACE",Backspace:"DELETE",ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT",Fn:"FN"};
if(_km[e.key]){addMT(_km[e.key]);return}
// Modifiers with left/right
if(e.key==="Shift"){addMT(e.location===2?"RSHIFT":"LSHIFT");return}
if(e.key==="Control"){addMT(e.location===2?"RCONTROL":"LCONTROL");return}
if(e.key==="Alt"){addMT(e.location===2?"ROPTION":"LOPTION");return}
if(e.key==="Meta"){addMT(e.location===2?"RCOMMAND":"LCOMMAND");return}
addMT(e.key.toUpperCase())},{capture:true});function ungroupById(gid){if(!confirm("Ungroup?"))return;var page=cp_();if(!page)return;var before=page.keys.filter(function(k){return k.groups&&k.groups.indexOf(gid)>=0}).map(function(k){return _snapshot(k)});page.keys.forEach(function(k){if(k.groups){var idx=k.groups.indexOf(gid);if(idx>=0)k.groups.splice(idx,1);if(k.groups.length===0)k.groups=null}});var stillUsed=page.keys.some(function(k){return k.groups&&k.groups.indexOf(gid)>=0});if(!stillUsed)profile.groups=profile.groups.filter(function(g){return g.id!==gid});_pushUndo(before);selKeys.clear();selKey=null;selGroup=null;dirty=true;renderAll();}
function ungroupSelected(){
  const page=cp_();if(!page)return;
  const gids=new Set();selKeys.forEach(id=>{const k=page.keys.find(x=>x.id===id);if(k&&k.groups){for(var _gj=0;_gj<k.groups.length;_gj++)gids.add(k.groups[_gj])}});
  if(!gids.size)return;
  const before=page.keys.filter(function(k){return k.groups&&k.groups.some(function(g){return gids.has(g)})}).map(k=>_snapshot(k));
  page.keys.forEach(function(k){if(k.groups){k.groups=k.groups.filter(function(g){return !gids.has(g)});if(k.groups.length===0)k.groups=null}});
  if(profile.groups)profile.groups=profile.groups.filter(g=>!gids.has(g.id));
  _pushUndo(before);dirty=true;rr();rpr();
}

// ── Keyboard shortcuts ──
document.addEventListener("keydown",e=>{
  if((e.key==="Delete"||e.key==="Backspace")&&selKey&&!e.target.closest("input,select,textarea")){e.preventDefault();dkey()}
  const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key==="z"){e.preventDefault();if(e.shiftKey)redo();else undo()}
  if(mod&&e.key==="g"){e.preventDefault();if(e.shiftKey)ungroupSelected();else groupSelected()}
});

async function resetDefault(){
  if(!confirm("Reset to default 89-key keyboard? Current layout will be lost."))return;
  try{const r=await fetch("/api/default-template");var keepName=profile?profile.profileName:"";profile=await r.json();if(keepName)profile.profileName=keepName;activePage=profile.pages[0]?.id||"";panX=0;panY=0;selKey=null;selKeys.clear();dirty=true;renderAll();t("Default layout loaded")}catch(e){t("Failed: "+e,true)}
}
function cws(){
  var _p=location.protocol==="https:"?"wss:":"ws:";ws=new WebSocket(_p+"//"+location.hostname+":8082/ws");
  ws.onopen=()=>{document.getElementById("cs").textContent="connected";document.getElementById("cs").className="conn on"};
  ws.onclose=()=>{document.getElementById("cs").textContent="off";document.getElementById("cs").className="conn off";setTimeout(cws,2000)};
  ws.onmessage=e=>{const m=JSON.parse(e.data);if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update"){profile=m.profile;activeProfile=m.filename||activeProfile;activePage=profile.pages.find(p=>p.id===activePage)?activePage:(profile.pages[0]?.id||"");panX=profile.canvasX||0;panY=profile.canvasY||0;selKey=null;selKeys.clear();undoStack=[];redoStack=[];renderAll()}};
}