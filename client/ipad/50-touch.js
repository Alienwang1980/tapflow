// ── Touch events ──
const active=new Set();let touchUsed=false;const touchKey={};const _keyRepeat={};let shiftCount=0;let _lastPong=0;setInterval(function(){if(ws&&ws.readyState===WebSocket.OPEN){if(Date.now()-_lastPong>45000){try{ws.close()}catch(_e){}}else{try{ws.send(JSON.stringify({type:"ping"}))}catch(_e){}}}},15000);
// ── Touchpad 手势状态机 ── 滚动=两指同动;拖动=锚定指静止+移动指动(换指继续,签名=移动指单独抬起);tap=slop内短时抬起
var TP_TAP_TIME=300,TP_TAP_SLOP=8,TP_ANCHOR_SLOP=8,TP_DRAG_SETTLE=150,TP_TWO_GAP=500,TP_TWO_DIST=120;
var _tp={mode:"",anchor:null,move:null,swapped:false,dragAt:0,hist:{two:false,gap:0,dist0:0,ends:{}},fingers:{},kcfg:null};
function _tpScrollOk(){return !_tp.kcfg||_tp.kcfg.scrollEnabled!==false}
function _tpRightOk(){return !_tp.kcfg||_tp.kcfg.rightClickEnabled!==false}
function _tpSend(action,extra){if(ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(Object.assign({type:"touchpad",action:action},extra)))}
function _tpDist(f){return Math.sqrt((f.lx-f.sx)*(f.lx-f.sx)+(f.ly-f.sy)*(f.ly-f.sy))}
function _tpAny(){for(var k in _tp.fingers)return true;return false}
function _tpReset(){_tp.mode="";_tp.anchor=null;_tp.move=null;_tp.swapped=false;_tp.dragAt=0;_tp.hist={two:false,gap:0,dist0:0,ends:{}};_tp.fingers={}}
function _tpStart(e,t,kd){
  if(_tp.fingers[t.identifier])return;
  _tp.fingers[t.identifier]={sx:t.clientX,sy:t.clientY,lx:t.clientX,ly:t.clientY,t0:e.timeStamp,moved:false};
  if(kd)_tp.kcfg=kd;
  if(_tp.mode==="drag"){_tp.move=t.identifier;return}
  if(_tp.mode==="scroll")return;
  if(_tp.anchor===null){_tp.anchor=t.identifier;return}
  var af=_tp.fingers[_tp.anchor];
  _tp.hist={two:true,gap:e.timeStamp-af.t0,dist0:Math.sqrt((t.clientX-af.sx)*(t.clientX-af.sx)+(t.clientY-af.sy)*(t.clientY-af.sy)),ends:{}};
}
function _tpMove(e,t){
  var f=_tp.fingers[t.identifier];if(!f)return;
  var dx=t.clientX-f.lx,dy=t.clientY-f.ly;f.lx=t.clientX;f.ly=t.clientY;
  if(!f.moved&&_tpDist(f)>TP_TAP_SLOP)f.moved=true;
  if(_tp.mode==="drag"){
    if(t.identifier===_tp.move){_tpSend("move",{dx:dx,dy:dy,drag:true});return}
    if(t.identifier===_tp.anchor&&!_tp.swapped&&e.timeStamp-_tp.dragAt<TP_DRAG_SETTLE&&_tpDist(f)>TP_ANCHOR_SLOP){if(_tpScrollOk()){_tpSend("mouseup",{button:"left"});_tp.mode="scroll";_tp.move=null}return}
    return;
  }
  if(_tp.mode==="scroll"){if(t.identifier!==_tp.anchor&&_tpScrollOk())_tpSend("scroll",{dx:dx*0.5,dy:dy*0.5});return}
  if(_tp.anchor===null)return;
  if(t.identifier===_tp.anchor){
    if(_tp.hist.two&&_tpDist(f)>TP_ANCHOR_SLOP&&_tpScrollOk()){_tp.mode="scroll"}
    else _tpSend("move",{dx:dx,dy:dy});
    return;
  }
  var af=_tp.fingers[_tp.anchor];
  if(_tpDist(f)>TP_TAP_SLOP&&af&&_tpDist(af)<=TP_ANCHOR_SLOP){
    _tp.mode="drag";_tp.move=t.identifier;_tp.swapped=false;_tp.dragAt=e.timeStamp;
    _tpSend("mousedown",{button:"left"});_tpSend("move",{dx:dx,dy:dy,drag:true});
  }
}
function _tpEnd(e,t){
  var f=_tp.fingers[t.identifier];if(!f)return;
  if(_tp.mode==="drag"){
    if(t.identifier===_tp.anchor){_tpSend("mouseup",{button:"left"});_tpReset();return}
    if(t.identifier===_tp.move){_tp.move=null;_tp.swapped=true;delete _tp.fingers[t.identifier];return}
  }
  if(_tp.mode==="scroll"){
    delete _tp.fingers[t.identifier];
    if(t.identifier===_tp.anchor||!_tpAny()){_tpReset()}
    else{_tp.mode="";_tp.hist={two:false,gap:0,dist0:0,ends:{}}}
    return;
  }
  var isAnchor=(t.identifier===_tp.anchor);
  _tp.hist.ends[t.identifier]={moved:f.moved,dist:_tpDist(f),dt:e.timeStamp-f.t0};
  delete _tp.fingers[t.identifier];
  if(isAnchor)_tp.anchor=null;
  if(_tpAny())return;
  var ends=_tp.hist.ends,okAll=true,nF=0;
  for(var k in ends){nF++;var ee=ends[k];if(ee.moved||ee.dist>=TP_TAP_SLOP||ee.dt>TP_TAP_TIME)okAll=false}
  if(_tp.hist.two){if(nF===2&&okAll&&_tp.hist.gap<TP_TWO_GAP&&_tp.hist.dist0<TP_TWO_DIST&&_tpRightOk())_tpSend("click",{button:"right"})}
  else if(nF===1&&okAll)_tpSend("click",{button:"left"});
  _tpReset();
}
function _tpCancel(e,t){
  if(!_tp.fingers[t.identifier])return;
  if(_tp.mode==="drag"&&t.identifier===_tp.anchor)_tpSend("mouseup",{button:"left"});
  _tpReset();
}
document.addEventListener("touchstart",e=>{e.preventDefault();touchUsed=true;for(let i=0;i<e.changedTouches.length;i++){const t=e.changedTouches[i];if(_tpAny()){_tpStart(e,t);continue}const el=(e.changedTouches.length===1&&e.target&&e.target.closest?e.target.closest(".key-btn"):null)||document.elementFromPoint(t.clientX,t.clientY)?.closest(".key-btn");if(el){const kid=el.dataset.keyId;if(kid){touchKey[t.identifier]=kid;if(!active.has(kid)){active.add(kid);el.classList.add("active");const pg=profile?.pages.find(p=>p.id===activePage),kd=pg?.keys.find(k=>k.id===kid);if(kd){if(kd.action==="switch-profile"){if(kd.targetProfile&&kd.targetProfile!=="none"){el._tapFn=kd.targetProfile;_spHoldStart(el,kid,kd.targetProfile,kd.sound)}else if(kd.targetProfile==="none"){el._tapFn=null}}else if(kd.action==="touchpad"){_tpStart(e,t,kd)}else if(kd.action!=="volume"&&kd.action!=="mic-mute"&&kd.action!=="active-app"&&kd.action!=="win-shortcuts"&&kd.action!=="win-gesture"&&kd.action!=="dock"&&kd.action!=="app-menu"&&kd.action!=="layout-preset"&&kd.action!=="audio-out"&&kd.action!=="audio-in"&&kd.action!=="switch-profile"&&kd.action!=="text-macro"&&kd.action!=="ime-switch"){psnd(kd.sound||(profile&&profile.defaultSound)||"none");if(kd.value==="SHIFT"||kd.key==="SHIFT"){shiftCount++;_redrawKbLabels()}if(ws&&ws.readyState===WebSocket.OPEN)if(kd.action==="hold"||kd.action==="turbo"){if(ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:"key",key:kd.value,action:"down"}));var _v=kd.value.toUpperCase();if(_v.indexOf("COMMAND")<0&&_v.indexOf("CONTROL")<0&&_v.indexOf("OPTION")<0&&_v.indexOf("SHIFT")<0&&_v.indexOf("FN")<0&&_v.indexOf("CAPSLOCK")<0){_keyRepeat[kid]=setTimeout(function _rp(){if(active.has(kid)&&ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:"key",key:kd.value,action:"press"}));_keyRepeat[kid]=setTimeout(_rp,70)}},400)}}}else{ws.send(JSON.stringify({type:"key",key:kd.value,action:"down"}))}}}}}}}},{passive:false});
document.addEventListener("touchend",e=>{e.preventDefault();for(let i=0;i<e.changedTouches.length;i++){const t=e.changedTouches[i];if(_tp.fingers[t.identifier])_tpEnd(e,t);const kid=touchKey[t.identifier];if(kid){active.delete(kid);delete touchKey[t.identifier];(function(){var _e=document.querySelector('[data-key-id="'+kid+'"]');_spHoldCancel(_e,_e&&_e._tapFn)})();if(_keyRepeat[kid]){clearTimeout(_keyRepeat[kid]);delete _keyRepeat[kid];}if(_keyRepeat[kid]){clearTimeout(_keyRepeat[kid]);delete _keyRepeat[kid];}const b=document.querySelector('[data-key-id="'+kid+'"]');if(b)b.classList.remove("active");const pg=profile?.pages.find(p=>p.id===activePage),kd=pg?.keys.find(k=>k.id===kid);if(kd&&kd.action!=="touchpad"&&kd.action!=="volume"&&kd.action!=="mic-mute"&&kd.action!=="active-app"&&kd.action!=="win-shortcuts"&&kd.action!=="win-gesture"&&kd.action!=="dock"&&kd.action!=="app-menu"&&kd.action!=="layout-preset"&&kd.action!=="switch-profile"&&kd.action!=="text-macro"&&ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:"key",key:kd.value,action:"up"}));if(kd.value==="SHIFT"||kd.key==="SHIFT"){shiftCount--;if(shiftCount<0)shiftCount=0;_redrawKbLabels()}}}},{passive:false});
document.addEventListener("touchcancel",e=>{e.preventDefault();for(let i=0;i<e.changedTouches.length;i++){const t=e.changedTouches[i];if(_tp.fingers[t.identifier])_tpCancel(e,t);const kid=touchKey[t.identifier];if(kid){active.delete(kid);delete touchKey[t.identifier];(function(){var _e=document.querySelector('[data-key-id="'+kid+'"]');_spHoldCancel(_e,_e&&_e._tapFn)})();if(_keyRepeat[kid]){clearTimeout(_keyRepeat[kid]);delete _keyRepeat[kid];}if(_keyRepeat[kid]){clearTimeout(_keyRepeat[kid]);delete _keyRepeat[kid];}const b=document.querySelector('[data-key-id="'+kid+'"]');if(b)b.classList.remove("active");const pg=profile?.pages.find(p=>p.id===activePage),kd=pg?.keys.find(k=>k.id===kid);if(kd&&kd.action!=="touchpad"&&kd.action!=="volume"&&kd.action!=="mic-mute"&&kd.action!=="active-app"&&kd.action!=="win-shortcuts"&&kd.action!=="win-gesture"&&kd.action!=="dock"&&kd.action!=="app-menu"&&kd.action!=="layout-preset"&&kd.action!=="switch-profile"&&kd.action!=="text-macro"&&ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:"key",key:kd.value,action:"up"}));if(kd.value==="SHIFT"||kd.key==="SHIFT"){shiftCount--;if(shiftCount<0)shiftCount=0;_redrawKbLabels()}}}},{passive:false});
document.addEventListener("touchmove",e=>{e.preventDefault();if(_tpAny()){for(let i=0;i<e.changedTouches.length;i++){const t=e.changedTouches[i];if(_tp.fingers[t.identifier])_tpMove(e,t)}return;}for(let i=0;i<e.changedTouches.length;i++){const t=e.changedTouches[i],el=document.elementFromPoint(t.clientX,t.clientY)?.closest(".key-btn"),okid=touchKey[t.identifier];if(okid){var released2=false;var ob2=document.querySelector('[data-key-id="'+okid+'"]');if(!el||!el.classList.contains("key-btn")||el.dataset.keyId!==okid){if(el&&el.classList.contains("key-btn")&&el.dataset.keyId!==okid){released2=true}else if(!el||!el.classList.contains("key-btn")){if(ob2){var r2=ob2.getBoundingClientRect();var tol2=15;if(t.clientX>=r2.left-tol2&&t.clientX<=r2.right+tol2&&t.clientY>=r2.top-tol2&&t.clientY<=r2.bottom+tol2){}else{released2=true}}else{released2=true}}else{released2=true}}else{released2=false}if(released2){active.delete(okid);const ob=ob2;if(ob)ob.classList.remove("active");_spHoldCancel(ob);const pg2=profile?.pages.find(p=>p.id===activePage),kd2=pg2?.keys.find(k=>k.id===okid);if(kd2&&ws&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:"key",key:kd2.value,action:"up"}));if(kd2.value==="SHIFT"||kd2.key==="SHIFT"){shiftCount--;if(shiftCount<0)shiftCount=0;_redrawKbLabels()}delete touchKey[t.identifier]}}if(el?.classList.contains("key-btn")){const kid=el.dataset.keyId;if(kid&&!active.has(kid)){touchKey[t.identifier]=kid;active.add(kid);el.classList.add("active");const pg=profile?.pages.find(p=>p.id===activePage),kd=pg?.keys.find(k=>k.id===kid);if(kd){if(kd.action==="switch-profile"){if(kd.targetProfile&&kd.targetProfile!=="none"){el._tapFn=kd.targetProfile;_spHoldStart(el,kid,kd.targetProfile,kd.sound)}else if(kd.targetProfile==="none"){el._tapFn=null}}else if(kd.action==="touchpad"){_tpStart(e,t,kd)}else if(kd.action!=="volume"&&kd.action!=="mic-mute"&&kd.action!=="active-app"&&kd.action!=="win-shortcuts"&&kd.action!=="win-gesture"&&kd.action!=="dock"&&kd.action!=="app-menu"&&kd.action!=="layout-preset"&&kd.action!=="audio-out"&&kd.action!=="audio-in"&&kd.action!=="switch-profile"&&kd.action!=="text-macro"&&kd.action!=="ime-switch"){psnd(kd.sound||(profile&&profile.defaultSound)||"none");if(kd.value==="SHIFT"||kd.key==="SHIFT"){shiftCount++;_redrawKbLabels()}if(ws&&ws.readyState===WebSocket.OPEN)if(kd.action==="hold"||kd.action==="turbo"){if(ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:"key",key:kd.value,action:"down"}));var _v=kd.value.toUpperCase();if(_v.indexOf("COMMAND")<0&&_v.indexOf("CONTROL")<0&&_v.indexOf("OPTION")<0&&_v.indexOf("SHIFT")<0&&_v.indexOf("FN")<0&&_v.indexOf("CAPSLOCK")<0){_keyRepeat[kid]=setTimeout(function _rp(){if(active.has(kid)&&ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:"key",key:kd.value,action:"press"}));_keyRepeat[kid]=setTimeout(_rp,70)}},400)}}}else{ws.send(JSON.stringify({type:"key",key:kd.value,action:"down"}))}}}}}}},{passive:false});
var _spHoldTimer=null,_spHoldRaf=null;
function _spHoldStart(el,kid,tapFn,snd){var kc2=el.style.background||"";var _holdSnd=snd;
  var start=Date.now(),dur=1000;
  _spHoldTimer=setTimeout(function(){
    cancelAnimationFrame(_spHoldRaf);
    _showProfilePopup(activeProfile);
    if(typeof psnd==="function")psnd(_holdSnd||(profile&&profile.defaultSound)||"click")
    _spHoldTimer=null;
  },dur);
  (function _spAnimate(){
    var elapsed=Date.now()-start;
    el._spPct=Math.min(100,Math.round(elapsed/dur*100));var pct=el._spPct;
    var _ov=el.querySelector(".sp-ov");if(!_ov){_ov=document.createElement("div");_ov.className="sp-ov";_ov.style.cssText="position:absolute;left:50%;top:50%;width:100%;height:100%;transform:translate(-50%,-50%) scale("+(pct/100)+");background:rgba(255,255,255,0.2);border-radius:inherit;pointer-events:none;transform-origin:center center";el.appendChild(_ov)}_ov.style.transform="translate(-50%,-50%) scale("+(pct/100)+")";
    if(elapsed<dur)_spHoldRaf=requestAnimationFrame(_spAnimate);
  })();
}
function _spHoldCancel(el,tapFn){
  if(_spHoldTimer){clearTimeout(_spHoldTimer);_spHoldTimer=null}
  if(_spHoldRaf){cancelAnimationFrame(_spHoldRaf);_spHoldRaf=null}
  if(el){
    var _ov2=el.querySelector(".sp-ov");
    if(_ov2){
      if(tapFn&&(!el._spPct||el._spPct<99)){setTimeout(function(){switchToProfile(tapFn)},50)}
      var _end=el._spPct||0;
      if(_end>0){var _rS=Date.now();(function _spRev(){var _e2=Date.now()-_rS;var _rPct=Math.max(0,_end-_e2/1000*100);_ov2.style.transform="translate(-50%,-50%) scale("+(_rPct/100)+")";if(_rPct>0)requestAnimationFrame(_spRev);else _ov2.remove()})()}else{_ov2.remove()}
    }else if(tapFn){setTimeout(function(){switchToProfile(tapFn)},50)}
  }
}
