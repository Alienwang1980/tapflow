async function lpl(){const r=await fetch("/api/profiles");profiles=(await r.json()).profiles||[];rpl()}
async function lp(fn){if(fn==="__manage__"){openProfileManager();this.value=activeProfile||"";return}const r=await fetch("/api/profiles/"+fn);profile=await r.json();activeProfile=fn;activePage=profile.pages[0]?.id||"";selKey=null;selKeys.clear();panX=profile.canvasX||0;panY=profile.canvasY||0;try{localStorage.setItem("stp_active",fn)}catch(e){};profileLoaded=true;renderAll();fetch("/api/active-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:fn})}).catch(function(){})}
async function saveProfile(){
  if(!profile)return;
  profile.canvasX=panX;profile.canvasY=panY;
  profile._filename=activeProfile;
  const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});
  delete profile._filename;
  const d=await r.json();activeProfile=d.filename;dirty=false;
  if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:"profile_saved",filename:d.filename}));
  lpl();t("Saved & synced");
}
async function dp(fn){if(!confirm("Delete "+fn+"?"))return;await fetch("/api/profiles/"+fn,{method:"DELETE"});if(activeProfile===fn){activeProfile="Default.json";await lp("Default.json")}lpl()}
async function saveAs(){const nm=prompt("Save as profile name:",profile?profile.profileName:"");if(!nm)return;profile.profileName=nm;profile.canvasX=panX;profile.canvasY=panY;const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});const d=await r.json();activeProfile=d.filename;dirty=false;lpl();t("Saved as "+d.filename)}
async function cp(){const p={profileName:"Untitled",version:"1.0",device:"iPad 11\"",deviceWidth:834,deviceHeight:1210,cellSize:60,gap:0,canvasX:0,canvasY:0,defaultSound:"click",windowRules:[],pages:[{id:"main",label:"Main",keys:[]}],groups:[]};const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});lpl();lp((await r.json()).filename)}
function apg(){const lb=document.getElementById("npl").value.trim();if(!lb)return;profile.pages.push({id:"p_"+Date.now(),label:lb,keys:[],bgColor:"#1a1a2e",bgPattern:null,bgPatternColor:"#ffffff",bgPatternSize:60});activePage=profile.pages[profile.pages.length-1].id;dirty=true;document.getElementById("npl").value="";renderAll()}
async function renameProfile(fn){const nm=prompt("Rename profile:",fn.replace(".json",""));if(!nm||!nm.trim())return;const r=await fetch("/api/profiles/"+encodeURIComponent(fn)+"/rename",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({newName:nm.trim()})});if(r.ok){const d=await r.json();if(activeProfile===fn)activeProfile=d.filename;lpl();t("Renamed to "+d.filename)}}
async function copyProfile(fn){const r=await fetch("/api/profiles/"+fn);const p=await r.json();p.profileName=(p.profileName||fn.replace(".json",""))+" (Copy)";const r2=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});lpl();t("Copied: "+p.profileName)}
function dpg(pid){if(profile.pages.length<=1)return;profile.pages=profile.pages.filter(p=>p.id!==pid);if(activePage===pid)activePage=profile.pages[0].id;selKey=null;selKeys.clear();dirty=true;renderAll()}
function cp_(){return profile?.pages.find(p=>p.id===activePage)}
function renderAll(){rpl();rpgl();rr();rpr();rgrp()}
function rpl(){var _pl=document.getElementById("pl");if(_pl)_pl.innerHTML=profiles.map(p=>'<div class="it'+(p.filename===activeProfile?" ac":"")+'" onclick="lp(\''+p.filename+'\')">'+hesc(p.profileName)+'<span class="x" onclick="event.stopPropagation();dp(\''+p.filename+'\')">×</span></div>').join("");var tpf=document.getElementById("tpf");if(tpf){tpf.innerHTML=profiles.map(function(p){return"<option value='"+p.filename+"'>"+p.profileName+"</option>"}).join("")+"<option value='__manage__' style='color:var(--accent)'>Manage...</option></option>";if(activeProfile)tpf.value=activeProfile}}
function rpgl(){document.getElementById("pgl").innerHTML=profile?.pages.map(p=>'<div class="it'+(p.id===activePage?" ac":"")+'" onclick="activePage=\''+p.id+'\';selKey=null;selKeys.clear();selGroup=null;renderAll()">'+hesc(p.label)+'<span class="x" onclick="event.stopPropagation();dpg(\''+p.id+'\')">×</span></div>').join("")||"";var _cp=cp_();var _bg=document.getElementById("pageBg");if(_bg&&_cp)_bg.value=_cp.bgColor||"#1a1a2e";var _pt=document.getElementById("pagePat");if(_pt&&_cp)_pt.value=_cp.bgPattern||"none";var _pc=document.getElementById("pagePatColor");if(_pc&&_cp)_pc.value=_cp.bgPatternColor||"#ffffff";var _ps=document.getElementById("pagePatSz");if(_ps&&_cp)_ps.textContent=_cp.bgPatternSize||60}

function upkPageBg(v){var p=cp_();if(!p)return;p.bgColor=v;dirty=true;rr()}
function upkPagePattern(v){var p=cp_();if(!p)return;p.bgPattern=v==="none"?null:v;dirty=true;rr()}
function upkPagePatternColor(v){var p=cp_();if(!p)return;p.bgPatternColor=v;dirty=true;rr()}
function upkPagePatternSize(d){var p=cp_();if(!p)return;var max=2000;if(_patIMG(p.bgPattern)){d=d>0?100:-100;max=5000}var ns=Math.max(10,Math.min(max,(p.bgPatternSize||60)+d));p.bgPatternSize=ns;var _ps=document.getElementById("pagePatSz");if(_ps)_ps.textContent=ns;dirty=true;rr()}
function _overlap(a,b){return !(a.col+a.w<=b.col||b.col+b.w<=a.col||a.row+a.h<=b.row||b.row+b.h<=a.row)}
function _collides(kid,col,row,w,h){
  const page=cp_();if(!page)return false;
  return page.keys.some(k=>k.id!==kid&&_overlap({col,row,w,h},{col:k.col||0,row:k.row||0,w:k.w||1,h:k.h||1}));
}
function _snap4(v){return Math.round(v*4)/4}

// Screen → cell coordinates (for selection rect)
function _gradCSS(preset,color){const c=color||'#0f3460';const m={'top-down':'linear-gradient(180deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','left-right':'linear-gradient(90deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','diagonal-tl':'linear-gradient(135deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','diagonal-tr':'linear-gradient(225deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','radial':'radial-gradient(circle,'+c+' 0%,rgba(0,0,0,0.6) 100%)'};return m[preset]||c}

function _scr2cell(sx,sy){
  const ca=document.getElementById("carea"),rect=ca.getBoundingClientRect(),cw=ca.clientWidth,ch=ca.clientHeight;
  const dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210,cs=profile.cellSize||60,gp=profile.gap||0;
  const cpx=cs+gp;
  const scale=Math.min(cw*0.85/dw,ch*0.85/dh);
  const ox=(cw-dw*scale)/2,oy=(ch-dh*scale)/2;
  const dx=(sx-rect.left-ox)/scale,dy=(sy-rect.top-oy)/scale;
  return {col:(dx-dw/2)/cpx-panX,row:(dy-dh/2)/cpx-panY};
}