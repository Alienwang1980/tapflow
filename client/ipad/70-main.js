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