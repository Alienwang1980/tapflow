function conn(){
  const p=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(p+"//"+location.hostname+":8082/ws");
  ws.onopen=()=>{delay=1000};
  ws.onmessage=e=>{const m=JSON.parse(e.data);if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update"){profile=m.profile;activeProfile=m.filename||activeProfile;activePage=profile.pages.find(p=>p.id===activePage)?activePage:(profile.pages[0]?.id||"");render()}else if(m.type==="profile_switch"){activePage=m.page||activePage;render()}};
  ws.onclose=()=>{timer=setTimeout(()=>{delay=Math.min(delay*1.5,15000);conn()},delay)};
  ws.onerror=()=>{};