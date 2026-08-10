async function lpl(){const r=await fetch("/api/profiles");profiles=(await r.json()).profiles||[];rpl()}
async function lp(fn){if(fn==="__manage__"){openProfileManager();return}const r=await fetch("/api/profiles/"+fn);profile=await r.json();activeProfile=fn;activePage=profile.pages[0]?.id||"";selKey=null;selKeys.clear();panX=profile.canvasX||0;panY=profile.canvasY||0;viewX=0;viewY=0;viewZoom=Math.max(0.3,Math.min(3,profile.viewZoom||1));try{localStorage.setItem("stp_active",fn)}catch(e){};profileLoaded=true;renderAll();fetch("/api/active-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:fn})}).catch(function(){})}
async function saveProfile(){
  if(!profile)return;
  for(var _dbg_p=0;_dbg_p<(profile.pages||[]).length;_dbg_p++){
    var _dbg_pg=profile.pages[_dbg_p];
    for(var _dbg_k=0;_dbg_k<(_dbg_pg.keys||[]).length;_dbg_k++){
      var _dbg_key=_dbg_pg.keys[_dbg_k];
      if(_dbg_key.action==="active-app")console.log("SAVE DEBUG active-app:",JSON.stringify({sound:_dbg_key.sound,closeSound:_dbg_key.closeSound}));
    }
  }
  profile.canvasX=panX;profile.canvasY=panY;profile.viewX=viewX;profile.viewY=viewY;profile.viewZoom=viewZoom;
  profile._filename=activeProfile;
  const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});
  delete profile._filename;
  const d=await r.json();activeProfile=d.filename;dirty=false;
  if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:"profile_saved",filename:d.filename}));
  lpl();t("Saved & synced");
}
async function dp(fn){if(!confirm("Delete "+fn+"?"))return;await fetch("/api/profiles/"+fn,{method:"DELETE"});if(activeProfile===fn){activeProfile="Default.json";await lp("Default.json")}lpl()}
async function saveAs(){const nm=prompt("Save as profile name:",profile?profile.profileName:"");if(!nm)return;profile.profileName=nm;profile.canvasX=panX;profile.canvasY=panY;profile.viewX=viewX;profile.viewY=viewY;profile.viewZoom=viewZoom;const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(profile)});const d=await r.json();activeProfile=d.filename;dirty=false;lpl();rpgl();t("Saved as "+d.filename)}
async function cp(){const p={profileName:"Untitled",version:"1.0",device:"iPad 11\"",deviceWidth:1210,deviceHeight:834,cellSize:60,gap:0,canvasX:0,canvasY:0,defaultSound:"click",windowRules:[],pages:[{id:"main",label:"Main",keys:[]}],groups:[]};const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});lpl();lp((await r.json()).filename)}
function apg(){var n=1;while(profile.pages.some(function(p){return p.label==="Page "+n}))n++;profile.pages.push({id:"p_"+Date.now(),label:"Page "+n,keys:[],bgColor:"#1a1a2e",bgPattern:null,bgPatternColor:"#ffffff",bgPatternSize:60});activePage=profile.pages[profile.pages.length-1].id;dirty=true;renderAll()}
async function renameProfile(fn){const nm=prompt("Rename profile:",fn.replace(".json",""));if(!nm||!nm.trim())return;const r=await fetch("/api/profiles/"+encodeURIComponent(fn)+"/rename",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({newName:nm.trim()})});if(r.ok){const d=await r.json();if(activeProfile===fn)activeProfile=d.filename;lpl();t("Renamed to "+d.filename)}}
async function copyProfile(fn){const r=await fetch("/api/profiles/"+fn);const p=await r.json();p.profileName=(p.profileName||fn.replace(".json",""))+" (Copy)";const r2=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});lpl();t("Copied: "+p.profileName)}
function dpg(pid){if(profile.pages.length<=1)return;profile.pages=profile.pages.filter(p=>p.id!==pid);if(activePage===pid)activePage=profile.pages[0].id;selKey=null;selKeys.clear();dirty=true;renderAll()}
function cp_(){return profile?.pages.find(p=>p.id===activePage)}
function _edWinArrow(c,dir,cx,cy,s){if(dir==="center"){c.fillRect(cx-s*0.6,cy-s*0.6,s*1.2,s*1.2);return}c.beginPath();if(dir==="up"){c.moveTo(cx,cy-s);c.lineTo(cx-s,cy+s*0.65);c.lineTo(cx+s,cy+s*0.65)}else if(dir==="down"){c.moveTo(cx,cy+s);c.lineTo(cx-s,cy-s*0.65);c.lineTo(cx+s,cy-s*0.65)}else if(dir==="left"){c.moveTo(cx-s,cy);c.lineTo(cx+s*0.65,cy-s);c.lineTo(cx+s*0.65,cy+s)}else{c.moveTo(cx+s,cy);c.lineTo(cx-s*0.65,cy-s);c.lineTo(cx-s*0.65,cy+s)}c.closePath();c.fill()}
