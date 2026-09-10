// ── Group/Ungroup ──
function groupSelected(){
  if(selKeys.size<2)return;
  const page=cp_();if(!page)return;
  const before=page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k));
  const gid="g_"+Date.now();
  if(!profile.groups)profile.groups=[];
  profile.groups.push({id:gid,name:"Group "+(profile.groups.length+1)});
  page.keys.forEach(function(k){if(selKeys.has(k.id)){if(!k.groups)k.groups=[];if(k.groups.indexOf(gid)<0)k.groups.push(gid)}});
  _pushUndo(before);_setDirty();rr();rpr();rgrp();
}
function rgrp(){const groups=profile?.groups||[];var _gh=selKeys.size===1?"Select 1 more key to group":"Select 2+ keys, then + Group";document.getElementById("grpl").innerHTML=groups.length?groups.map(g=>"<div class=\"it\" onclick=\"selectGroup('"+g.id+"')\">"+hesc(g.name)+"<span class=\"x\" onclick=\"event.stopPropagation();ungroupById('"+g.id+"')\">✕</span></div>").join(""):"<p style=\"font-size:10px;color:var(--dim);padding:8px 0\">"+_gh+"</p>";}function saveAsGroup(){var name=prompt("Group name:","Group "+((profile.groups?.length||0)+1));if(!name||!name.trim())return;var gid="g_"+Date.now();if(!profile.groups)profile.groups=[];profile.groups.push({id:gid,name:name.trim()});var page=cp_();if(!page)return;var before=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});page.keys.forEach(function(k){if(selKeys.has(k.id)){if(!k.groups)k.groups=[];if(k.groups.indexOf(gid)<0)k.groups.push(gid)}});_pushUndo(before);_setDirty();renderAll();}
function selectGroup(gid){selGroup=gid;selKeys.clear();selKey=null;cp_().keys.forEach(k=>{if(k.groups&&k.groups.indexOf(gid)>=0)selKeys.add(k.id)});rr();rpr();rgrp();}
let mT=[],mM=1,mTK=null;function openMM(kid){mTK=kid;mT=[];var k=cp_()?.keys.find(function(x){return x.id===kid});var lbl=document.getElementById("mkl");if(lbl)lbl.textContent="Assigning: "+(k?k.label:kid)+(k&&k.value?" (current: "+k.value+")":"");renderMT();_showModal("macroModal");document.getElementById("mtc").focus()}function closeMM(){_hideModal("macroModal");mT=[];mTK=null}function setMM(m){mM=m;document.getElementById("mcb").style.background=m===1?"var(--accent)":"var(--card)";document.getElementById("msq").style.background=m===2?"var(--accent)":"var(--card)";document.getElementById("mcb").style.color=m===1?"#fff":"var(--text)";document.getElementById("msq").style.color=m===2?"#fff":"var(--text)"}function addMT(key){mT.push(key);renderMT()}function renderMT(){document.getElementById("mtc").innerHTML=(mT.length===0?"<span style=color:var(--dim);font-size:11px>Click here and type keys, or click modifiers...</span>":"")+mT.map(function(k,i){return"<span data-mi="+i+" style=background:var(--card);padding:3px 8px;border-radius:3px;font-size:12px;display:inline-flex;align-items:center;gap:4px>"+k+"<span onclick=removeMT("+i+") style=cursor:pointer;color:var(--red);margin-left:4px>x</span></span>"}).join("")}function removeMT(i){mT.splice(i,1);renderMT()}function saveMacro(){var v=mT.join("+");var k=cp_()?.keys.find(function(x){return x.id===mTK});if(k){var b=_snapshot(k);k.value=v;k.action="macro";if(JSON.stringify(b)!==JSON.stringify(_snapshot(k)))_pushUndo([b])}closeMM();_setDirty();rr();rpr()}document.addEventListener("keydown",function(e){var mm=document.getElementById("macroModal");if(!mm||mm.style.display!=="flex")return;if(e.key==="Escape")return;e.preventDefault();e.stopPropagation();// Map physical keys with left/right distinction
var _km={Enter:"ENTER",Tab:"TAB"," ":"SPACE",Backspace:"DELETE",ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT",Fn:"FN"};
if(_km[e.key]){addMT(_km[e.key]);return}
// Modifiers with left/right
if(e.key==="Shift"){addMT(e.location===2?"RSHIFT":"LSHIFT");return}
if(e.key==="Control"){addMT(e.location===2?"RCONTROL":"LCONTROL");return}
if(e.key==="Alt"){addMT(e.location===2?"ROPTION":"LOPTION");return}
if(e.key==="Meta"){addMT(e.location===2?"RCOMMAND":"LCOMMAND");return}
addMT(e.key.toUpperCase())},{capture:true});function ungroupById(gid){if(!confirm("Ungroup?"))return;var page=cp_();if(!page)return;var before=page.keys.filter(function(k){return k.groups&&k.groups.indexOf(gid)>=0}).map(function(k){return _snapshot(k)});page.keys.forEach(function(k){if(k.groups){var idx=k.groups.indexOf(gid);if(idx>=0)k.groups.splice(idx,1);if(k.groups.length===0)k.groups=null}});var stillUsed=page.keys.some(function(k){return k.groups&&k.groups.indexOf(gid)>=0});if(!stillUsed)profile.groups=profile.groups.filter(function(g){return g.id!==gid});_pushUndo(before);selKeys.clear();selKey=null;selGroup=null;_setDirty();renderAll();}
function ungroupSelected(){
  const page=cp_();if(!page)return;
  const gids=new Set();selKeys.forEach(id=>{const k=page.keys.find(x=>x.id===id);if(k&&k.groups){for(var _gj=0;_gj<k.groups.length;_gj++)gids.add(k.groups[_gj])}});
  if(!gids.size)return;
  const before=page.keys.filter(function(k){return k.groups&&k.groups.some(function(g){return gids.has(g)})}).map(k=>_snapshot(k));
  page.keys.forEach(function(k){if(k.groups){k.groups=k.groups.filter(function(g){return !gids.has(g)});if(k.groups.length===0)k.groups=null}});
  if(profile.groups)profile.groups=profile.groups.filter(g=>!gids.has(g.id));
  _pushUndo(before);_setDirty();rr();rpr();
}

// ── Keyboard shortcuts ──
document.addEventListener("keydown",e=>{
  if(_seOpen){
    const m2=e.ctrlKey||e.metaKey;
    if(e.key==="Escape"){e.preventDefault();closeSoundEdit()}
    else if(m2&&(e.key==="s"||e.key==="S")){e.preventDefault();saveProfile()}
    else if(m2&&e.key==="z"){e.preventDefault();if(e.shiftKey)redo();else undo()}
    return;
  }
  if((e.key==="Delete"||e.key==="Backspace")&&(selKey||selKeys.size>0)&&!e.target.closest("input,select,textarea")){e.preventDefault();dkey()}
  const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key==="z"){e.preventDefault();if(e.shiftKey)redo();else undo()}
  if(mod&&e.key==="g"){e.preventDefault();if(e.shiftKey)ungroupSelected();else groupSelected()}
  if(mod&&(e.key==="s"||e.key==="S")){e.preventDefault();saveProfile()}
});

async function resetDefault(){
  if(!confirm("Clear current profile? All keys will be removed."))return;
  if(!profile)return;
  profile.pages=[{id:"main",label:"Main",keys:[]}];
  profile.canvasX=0;profile.canvasY=0;profile.viewX=0;profile.viewY=0;profile.viewZoom=1;
  activePage="main";selKey=null;selKeys.clear();
  _setDirty();renderAll();t("Profile cleared")
}
// ── 远端 profile 更新 ──
// profile_update 到达时若本地 dirty,先弹冲突选择,不静默覆盖(数据安全)。
let _wsPending=null,_savingSig=null;
function _applyRemoteProfile(m){profile=m.profile;profile.pages.forEach(function(pg){pg.keys.forEach(function(k){if(k.action==="switch-profile"&&k.targetProfile){var pf=profiles.find(function(x){return x.filename===k.targetProfile});if(pf)k.label=pf.profileName}})});activeProfile=m.filename||activeProfile;activePage=profile.pages.find(p=>p.id===activePage)?activePage:(profile.pages[0]?.id||"");panX=profile.canvasX||0;panY=profile.canvasY||0;viewX=0;viewY=0;viewZoom=Math.max(0.3,Math.min(3,profile.viewZoom||1));selKey=null;selKeys.clear();undoStack=[];redoStack=[];_markClean();renderAll()}
function wsConflictKeep(){_wsPending=null;_hideModal("wsConflictModal")}
function wsConflictTake(){var m=_wsPending;_wsPending=null;_hideModal("wsConflictModal");if(m)_applyRemoteProfile(m)}
function cws(){
  var _p=location.protocol==="https:"?"wss:":"ws:";ws=new WebSocket(_p+"//"+location.hostname+":8082/ws");
  ws.onopen=()=>{document.getElementById("cs").textContent="connected";document.getElementById("cs").className="conn on";_wsOk=true;_refreshSaveBtn()};
  ws.onclose=()=>{document.getElementById("cs").textContent="off";document.getElementById("cs").className="conn off";_wsOk=false;_refreshSaveBtn();setTimeout(cws,2000)};
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==="settings"){_gFont=m.fontFamily||"";_gBalCur=m.balanceCurrency||_gBalCur;if(profileLoaded)renderAll()}else if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update"){if(m.type==="profile_update"){if(m.filename&&m.filename!==activeProfile)return;if(_savingSig&&_normSig(m.profile)===_savingSig){_savingSig=null;return}if(dirty){_wsPending=m;_showModal("wsConflictModal");return}}_applyRemoteProfile(m)};if(m.type==="color-change"){if(_cp&&m.color&&/^#[0-9a-fA-F]{6}$/.test(m.color)&&m.color!==_cp.inp.value){_cp.inp.value=m.color;_cp.inp.dispatchEvent(new Event("input",{bubbles:true}))}}if(m.type==="color-close"){_cpClose(true)}};
}
// ── Native color panel (NSColorPanel bridge) ──
// Safari's <input type=color> auto-closes the panel on every selection.
// Clicks on color inputs are intercepted and the real macOS color panel is
// opened by the server instead; color changes stream back over WebSocket and
// are applied by dispatching the input's existing oninput/onchange handlers.
let _cp=null; // {inp, initial}
function _cpOpen(inp){
  if(!(ws&&ws.readyState===WebSocket.OPEN)){t("Server not connected");return}
  if(_cp&&_cp.inp===inp){_cpClose(true);ws.send(JSON.stringify({type:"close-color-panel"}));return}
  if(_cp)_cpClose(true);
  _cp={inp:inp,initial:inp.value};
  ws.send(JSON.stringify({type:"open-color-panel",color:inp.value}));
}
function _cpClose(commit){
  if(!_cp)return;
  var inp=_cp.inp,initial=_cp.initial;_cp=null;
  if(commit&&inp.value!==initial)inp.dispatchEvent(new Event("change",{bubbles:true}));
}
document.addEventListener("click",function(e){
  var el=e.target&&e.target.closest?e.target.closest('input[type="color"]'):null;
  if(el){e.preventDefault();e.stopPropagation();_cpOpen(el)}
},true);
