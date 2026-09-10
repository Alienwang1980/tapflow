async function lpl(){const r=await fetch("/api/profiles");profiles=(await r.json()).profiles||[];rpl()}
let _pendingLp=null;
function lp(fn){if(fn==="__manage__"){openProfileManager();return}if(profile&&dirty&&fn!==activeProfile){_pendingLp=fn;_showModal("unsavedModal");return}_doLp(fn,true)}
async function _doLp(fn,fromSwitch){if(_seOpen)closeSoundEdit();const r=await fetch("/api/profiles/"+fn);if(!r.ok){if(profiles&&profiles.length>0){return _doLp(profiles[0].filename,fromSwitch)}else{activeProfile="";profile=null;profileLoaded=true;selKey=null;selKeys.clear();try{localStorage.removeItem("stp_active")}catch(e){};_markClean();renderAll();return}}profile=await r.json();activeProfile=fn;activePage=profile.pages[0]?.id||"";selKey=null;selKeys.clear();panX=profile.canvasX||0;panY=profile.canvasY||0;viewX=0;viewY=0;viewZoom=Math.max(0.3,Math.min(3,profile.viewZoom||1));try{localStorage.setItem("stp_active",fn)}catch(e){};profileLoaded=true;if(fromSwitch){_savedSnap=null;dirty=false;_refreshSaveBtn()}else{_markClean()}renderAll();buildRatioPresets();fetch("/api/active-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:fn})}).catch(function(){})}
async function unsavedGo(save){var fn=_pendingLp;_pendingLp=null;_hideModal("unsavedModal");if(save){await saveProfile()}dirty=false;await _doLp(fn,true)}
function unsavedCancel(){_pendingLp=null;_hideModal("unsavedModal")}
async function saveProfile(){
  if(!profile)return;
  profile.canvasX=panX;profile.canvasY=panY;profile.viewX=viewX;profile.viewY=viewY;profile.viewZoom=viewZoom;
  profile._filename=activeProfile;
  var _sigSent=_profSig();   // 本次落盘内容的签名 — 保存期间的新编辑不得被误标为已保存
  var _saveSig=_profSig(true);_savingSig=_saveSig; // 无 _filename 版: 服务端会 pop 掉 _filename,保存回声内容与此一致
  setTimeout(function(){if(_savingSig===_saveSig)_savingSig=null},2000); // 2s 过期兜底: 保存失败/回声丢失时守卫不永久闩住
  // 注意: 不再发 profile_saved — 保存本身已触发服务端广播(POST /api/profiles → broadcast_profile_update),
  // 再发 profile_saved 会让服务端二次广播,第二条回声逃过 _savingSig 守卫,编辑中会误弹冲突窗
  try{
    const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});
    delete profile._filename;
    const d=await r.json();activeProfile=d.filename;
    if(_profSig()===_sigSent){_markClean()}else{_setDirty()}
    lpl();t("Saved & synced");
  }catch(e){
    delete profile._filename;
    _setDirty();t("Save failed: "+e.message);
  }
}
async function dp(fn){var _pn=(profiles.find(function(p){return p.filename===fn})||{}).profileName||fn;if(!confirm('Delete profile "'+_pn+'"?'))return;await fetch("/api/profiles/"+fn,{method:"DELETE"});if(activeProfile===fn){var rem=profiles.filter(function(p){return p.filename!==fn});if(rem.length>0){dirty=false;await _doLp(rem[0].filename,true)}else{activeProfile="";profile=null;profileLoaded=false;selKey=null;selKeys.clear();try{localStorage.removeItem("stp_active")}catch(e){};_markClean()}}await lpl();renderAll()}
async function saveAs(){const nm=prompt("Save as profile name:",profile?profile.profileName:"");if(!nm)return;profile.profileName=nm;profile.canvasX=panX;profile.canvasY=panY;profile.viewX=viewX;profile.viewY=viewY;profile.viewZoom=viewZoom;var _sigSent=_profSig(true);_savingSig=_sigSent;setTimeout(function(){if(_savingSig===_sigSent)_savingSig=null},2000);try{const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});const d=await r.json();activeProfile=d.filename;if(_profSig(true)===_sigSent){_markClean()}else{_setDirty()}lpl();rpgl();t("Saved as "+d.filename)}catch(e){_setDirty();t("Save failed: "+e.message)}}
async function cp(){const p={profileName:"Untitled",version:"1.0",device:"iPad 11\"",deviceWidth:1194,deviceHeight:834,dpr:2,topInset:32,cellSize:60,gap:0,canvasX:0,canvasY:0,defaultSound:"click",windowRules:[],pages:[{id:"main",label:"Main",keys:[]}],groups:[]};const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});lpl();lp((await r.json()).filename)}
function apg(){var n=1;while(profile.pages.some(function(p){return p.label==="Page "+n}))n++;profile.pages.push({id:"p_"+Date.now(),label:"Page "+n,keys:[],bgColor:"#1a1a2e",bgPattern:null,bgPatternColor:"#ffffff",bgPatternSize:60});activePage=profile.pages[profile.pages.length-1].id;_setDirty();renderAll()}
async function renameProfile(fn){const nm=prompt("Rename profile:",fn.replace(".json",""));if(!nm||!nm.trim())return;const r=await fetch("/api/profiles/"+encodeURIComponent(fn)+"/rename",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({newName:nm.trim()})});if(r.ok){const d=await r.json();if(activeProfile===fn)activeProfile=d.filename;lpl();t("Renamed to "+d.filename)}}
async function copyProfile(fn){const r=await fetch("/api/profiles/"+fn);const p=await r.json();p.profileName=(p.profileName||fn.replace(".json",""))+" (Copy)";const r2=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});lpl();t("Copied: "+p.profileName)}
function dpg(pid){if(profile.pages.length<=1)return;profile.pages=profile.pages.filter(p=>p.id!==pid);if(activePage===pid)activePage=profile.pages[0].id;selKey=null;selKeys.clear();_setDirty();renderAll()}
function cp_(){return profile?.pages.find(p=>p.id===activePage)}
function _edWinArrow(c,dir,cx,cy,s){if(dir==="center"){c.fillRect(cx-s*0.6,cy-s*0.6,s*1.2,s*1.2);return}c.beginPath();if(dir==="up"){c.moveTo(cx,cy-s);c.lineTo(cx-s,cy+s*0.65);c.lineTo(cx+s,cy+s*0.65)}else if(dir==="down"){c.moveTo(cx,cy+s);c.lineTo(cx-s,cy-s*0.65);c.lineTo(cx+s,cy-s*0.65)}else if(dir==="left"){c.moveTo(cx-s,cy);c.lineTo(cx+s*0.65,cy-s);c.lineTo(cx+s*0.65,cy+s)}else{c.moveTo(cx+s,cy);c.lineTo(cx-s*0.65,cy-s);c.lineTo(cx-s*0.65,cy+s)}c.closePath();c.fill()}
