async function _showProfilePopup(currentFn){
  try{
    var r=await fetch("/api/profiles");
    var list=(await r.json()).profiles||[];
    var ov=document.createElement("div");
    ov.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:40px;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)";
    ov.addEventListener("touchstart",function(e){if(e.target===ov){e.stopPropagation();ov.remove()}});
    var ti=document.createElement("div");
    ti.style.cssText="color:#fff;font-size:18px;font-weight:600;margin-bottom:12px";
    ti.textContent="Switch Profile";
    ov.appendChild(ti);
    list.forEach(function(p){
      var btn=document.createElement("button");
      btn.textContent=p.profileName+(p.filename===currentFn?" (current)":"");
      btn.style.cssText="width:260px;padding:14px 20px;font-size:16px;font-weight:500;border-radius:12px;border:1px solid rgba(255,255,255,0.12);cursor:pointer;background:"+(p.filename===currentFn?"rgba(74,222,128,0.2)":"rgba(255,255,255,0.08)")+";color:#fff";
      btn.addEventListener("touchstart",function(e){e.stopPropagation();e.preventDefault();ov.remove();switchToProfile(p.filename)});
      ov.appendChild(btn);
    });
    var cancel=document.createElement("button");
    cancel.textContent="Cancel";
    cancel.style.cssText="width:260px;padding:12px;font-size:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);cursor:pointer;background:rgba(255,255,255,0.04);color:#888;margin-top:8px";
    cancel.addEventListener("touchstart",function(e){e.stopPropagation();e.preventDefault();ov.remove()});
    ov.appendChild(cancel);
    document.body.appendChild(ov);
  }catch(e){}
}
async function switchToProfile(fn){
  try{
    const r=await fetch("/api/profiles/"+fn);
    if(!r.ok){console.log("switchToProfile fetch failed:",fn);return}
    profile=await r.json();
    activeProfile=fn;
    activePage=profile.pages[0]?.id||"";
    profileLoaded=true;
    active.clear();
    for(var _tk in touchKey)delete touchKey[_tk];
    render();
    fetch("/api/active-profile",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({filename:fn})}).catch(function(){});
  }catch(e){console.log("switchToProfile error:",e)}
}
async function load(){
  try{const r=await fetch("/api/active-profile");const d=await r.json();profile=d.profile;activeProfile=d.filename||"Default.json";activePage=profile.pages[0]?.id||"";profileLoaded=true;render()}catch(e){}
  conn();
}

load();