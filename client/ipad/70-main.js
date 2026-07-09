async function load(){
  try{const r=await fetch("/api/active-profile");const d=await r.json();profile=d.profile;activeProfile=d.filename||"Default.json";activePage=profile.pages[0]?.id||"";profileLoaded=true;render()}catch(e){}
  conn();
}

load();