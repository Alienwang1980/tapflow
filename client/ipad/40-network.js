function conn(){
  const p=location.protocol==="https:"?"wss:":"ws:";
  ws=new WebSocket(p+"//"+location.hostname+":"+(location.port||"8082")+"/ws");
  ws.onopen=()=>{delay=1000;_lastPong=Date.now();fetch("/api/profiles/"+encodeURIComponent(activeProfile)).then(function(r){return r.ok?r.json():null}).then(function(pf){if(pf&&pf.pages){profile=pf;render();_loadProfNames(function(){render()})}}).catch(function(){});};
  fetch("/api/config").then(r=>r.json()).then(c=>{var f=c.fontFamily||"",cu=c.balanceCurrency||"CNY";if(f!==_gFont||cu!==_gBalCur){_gFont=f;_gBalCur=cu;if(profileLoaded)render()}}).catch(function(){});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.type==="pong"){_lastPong=Date.now()}else if((m.type==="profile"&&!profileLoaded)||m.type==="profile_update"){profile=m.profile;activeProfile=m.filename||activeProfile;activePage=profile.pages.find(p=>p.id===activePage)?activePage:(profile.pages[0]?.id||"");render();_loadProfNames(function(){render()})}else if(m.type==="profile_switch"){activePage=m.page||activePage;render()}else if(m.type==="settings"){_gFont=m.fontFamily||"";_gBalCur=m.balanceCurrency||_gBalCur;if(profileLoaded)render()}};
  ws.onclose=()=>{active.clear();shiftCount=0;for(var _rk in _keyRepeat){clearTimeout(_keyRepeat[_rk]);delete _keyRepeat[_rk]}for(var _tk in touchKey)delete touchKey[_tk];var _abs=document.querySelectorAll('.key-btn.active');for(var _ai=0;_ai<_abs.length;_ai++)_abs[_ai].classList.remove('active');_scheduleReconn()};
  ws.onerror=()=>{if(!ws||ws.readyState!==WebSocket.OPEN)_scheduleReconn()};
}
// ── Keyboard shift layer ── shiftCount>0 时双态键(kb 且带 shiftLabel)键帽显示 shiftLabel
function _dispLabel(k){return (shiftCount>0&&k.shiftLabel)?k.shiftLabel:k.label}
function _redrawKbLabels(){var _pg=profile?.pages.find(function(p){return p.id===activePage});if(!_pg)return;for(var i=0;i<_pg.keys.length;i++){var k=_pg.keys[i];if(!k.shiftLabel)continue;var _el=document.querySelector('[data-key-id="'+k.id+'"]');if(!_el)continue;var _ls=_el.querySelector('.kb-lbl');if(_ls){_ls.textContent=_dispLabel(k)}else if(_el.children.length===0){_el.textContent=_dispLabel(k)}}}
