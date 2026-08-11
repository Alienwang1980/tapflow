function conn(){
  const p=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(p+"//"+location.hostname+":8082/ws");
  ws.onopen=()=>{delay=1000};
  ws.onmessage=e=>{const m=JSON.parse(e.data);if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update"){profile=m.profile;activeProfile=m.filename||activeProfile;activePage=profile.pages.find(p=>p.id===activePage)?activePage:(profile.pages[0]?.id||"");render();_loadProfNames(function(){render()})}else if(m.type==="profile_switch"){activePage=m.page||activePage;render()}};
  ws.onclose=()=>{active.clear();for(var _rk in _keyRepeat){clearTimeout(_keyRepeat[_rk]);delete _keyRepeat[_rk]}for(var _tk in touchKey)delete touchKey[_tk];var _abs=document.querySelectorAll('.key-btn.active');for(var _ai=0;_ai<_abs.length;_ai++)_abs[_ai].classList.remove('active');timer=setTimeout(()=>{delay=Math.min(delay*1.5,15000);conn()},delay)};
  ws.onerror=()=>{};
}

