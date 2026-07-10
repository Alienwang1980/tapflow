// ── System Widgets (Window, Dock, Menu, Layout) ──

function _drawWinShortcuts(canvas) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var btns = [{label:"Full",api:"/api/system/window/fullscreen"},{label:"Min",api:"/api/system/window/minimize"},{label:"MC",api:"/api/system/window/mission-control"},{label:"Desktop",api:"/api/system/window/show-desktop"}];
  canvas._winBtns = btns;
  var cols = 2, rows = 2;
  var bw = (w - 8) / cols, bh = (h - 8) / rows;
  canvas._winBw = bw; canvas._winBh = bh;
  ctx.font = Math.max(8, Math.min(bh*0.35, bw*0.2)) + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  btns.forEach(function(b, i) {
    var col = i % cols, row = Math.floor(i / cols);
    var x = 4 + col * bw, y = 4 + row * bh;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    ctx.fillStyle = "#ccc";
    ctx.fillText(b.label, x + bw/2, y + bh/2);
  });
}

function _onWinShortcutTouch(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  var y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  var sc = canvas.width / rect.width;
  x *= sc; y *= sc;
  var col = Math.floor((x - 4) / canvas._winBw);
  var row = Math.floor((y - 4) / canvas._winBh);
  var idx = row * 2 + col;
  if (canvas._winBtns && canvas._winBtns[idx]) {
    fetch(canvas._winBtns[idx].api, {method:"POST"}).catch(function(){});
  }
}

// ── Dock Panel — horizontal, icons, transparent, scroll ──

function _drawDockGrid(canvas, apps) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!apps || !apps.length) return;
  var iconSize = Math.max(40, Math.min(56, h * 0.65));
  var gap = 6, itemW = iconSize + gap * 2;
  canvas._dockApps = apps; canvas._dockItemW = itemW; canvas._dockIconSize = iconSize;
  canvas._dockMaxScroll = Math.max(0, apps.length * itemW - w);
  if (!canvas._dockScroll) canvas._dockScroll = 0;
  if (canvas._dockScroll > canvas._dockMaxScroll) canvas._dockScroll = canvas._dockMaxScroll;
  var scrollX = canvas._dockScroll;
  var fs = Math.max(7, Math.min(iconSize * 0.17, w * 0.025));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center";
  for (var i = 0; i < apps.length; i++) {
    var x = i * itemW - scrollX + gap;
    if (x + iconSize < -10 || x > w + 10) continue;
    var a = apps[i];
    var iconY = (h - iconSize - fs - 6) / 2;
    // Pressed state highlight
    var pressed = (_dockPressedIdx === i);
    if (pressed) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x - 3, iconY - 5, iconSize + 6, iconSize + 18);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, iconY - 5, iconSize + 6, iconSize + 18);
    }
    if (a.running) {
      ctx.fillStyle = "#4ade80";
      ctx.beginPath(); ctx.arc(x + iconSize/2, iconY - 4, 4, 0, Math.PI*2); ctx.fill();
    }
    if (!canvas._dockIcons) canvas._dockIcons = {};
    var img = canvas._dockIcons[a.name];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      if (pressed) { ctx.translate(x + iconSize/2, iconY + iconSize/2); ctx.scale(1.1, 1.1); ctx.translate(-(x + iconSize/2), -(iconY + iconSize/2)); }
      ctx.drawImage(img, x, iconY, iconSize, iconSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(x, iconY, iconSize, iconSize);
      var initFs = Math.max(16, iconSize * 0.45);
      ctx.font = "bold " + initFs + "px -apple-system,sans-serif";
      ctx.fillStyle = "#888"; ctx.textBaseline = "middle";
      ctx.fillText(a.name.charAt(0).toUpperCase(), x + iconSize/2, iconY + iconSize/2);
      if (!canvas._dockIcons[a.name]) {
        var img2 = new Image();
        var capName = a.name;
        img2.onload = function(n) { return function() { canvas._dockIcons[n] = this; _drawDockGrid(canvas, canvas._dockApps); }; }(capName);
        img2.onerror = function() { canvas._dockIcons[capName] = {complete:true, naturalWidth:0}; };
        img2.src = "/api/system/app-icon?name=" + encodeURIComponent(a.bundle || a.name || "");
        canvas._dockIcons[a.name] = img2;
      }
    }
    ctx.fillStyle = "#ccc"; ctx.font = fs + "px -apple-system,sans-serif";
    ctx.textBaseline = "top";
    var label = a.name.length > 8 ? a.name.substring(0,7)+".." : a.name;
    ctx.fillText(label, x + iconSize/2, iconY + iconSize + 2);
  }
}

var _dockTX = 0, _dockTS = 0, _dockTMoved = false, _dockPressedIdx = -1, _dockTStart = 0;
function _onDockTouchStart(e, canvas) {
  e.preventDefault(); e.stopPropagation();
  touchUsed = true;
  var t = e.touches ? e.touches[0] : e;
  _dockTX = t.clientX; _dockTS = canvas._dockScroll || 0; _dockTMoved = false; _dockTStart = e.timeStamp || Date.now();
  // Detect which icon was pressed
  var rect = canvas.getBoundingClientRect();
  var cx = (t.clientX - rect.left) * (canvas.width / rect.width);
  _dockPressedIdx = Math.floor((cx + (canvas._dockScroll||0)) / (canvas._dockItemW||68));
  if (canvas._dockApps && (_dockPressedIdx < 0 || _dockPressedIdx >= canvas._dockApps.length)) _dockPressedIdx = -1;
  if (_dockPressedIdx >= 0) _drawDockGrid(canvas, canvas._dockApps);
  // rAF poll: check elapsed time every frame while holding
  var _cv2 = canvas, _pi2 = _dockPressedIdx;
  function _pollLP() {
    if (_dockTMoved || _dockPressedIdx !== _pi2) return;
    if (Date.now() - _dockTStart >= 600) {
      var app = _cv2._dockApps && _cv2._dockApps[_pi2];
      if (app) {
        var quitSnd = (_cv2._dockKey && _cv2._dockKey.quitSound) || "quit";
        if (typeof psnd === "function") psnd(quitSnd);
        fetch("/api/system/quit-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: app.bundle || app.name, path: app.path})}).catch(function(){});
        _dockPressedIdx = -1;
        if (_cv2._dockApps) _drawDockGrid(_cv2, _cv2._dockApps);
      }
      return;
    }
    requestAnimationFrame(_pollLP);
  }
  requestAnimationFrame(_pollLP);
}
function _onDockTouchMove(e, canvas) {
  e.stopPropagation();
  if (!canvas._dockMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dx = _dockTX - t.clientX;
  if (Math.abs(dx) > 8) { _dockTMoved = true; _dockPressedIdx = -1; }
  canvas._dockScroll = Math.max(0, Math.min(canvas._dockMaxScroll, _dockTS + dx));
  _drawDockGrid(canvas, canvas._dockApps);
}
function _onDockTouchEnd(e, canvas) {
  e.stopPropagation();
  var pressedIdx = _dockPressedIdx;
  _dockPressedIdx = -1;
  if (_dockTMoved || pressedIdx < 0) { _drawDockGrid(canvas, canvas._dockApps); return; }
  // Clear highlight
  _drawDockGrid(canvas, canvas._dockApps);
  var t = e.touches ? e.changedTouches[0] : e;
  var rect = canvas.getBoundingClientRect();
  var x = (t.clientX - rect.left) * (canvas.width / rect.width);
  var idx = Math.floor((x + (canvas._dockScroll||0)) / (canvas._dockItemW||68));
  if (canvas._dockApps && idx >= 0 && idx < canvas._dockApps.length) {
    var a = canvas._dockApps[idx];
    var elapsed = (e.timeStamp || Date.now()) - _dockTStart;
    if (elapsed >= 600) {
      // Long press — quit app
      var quitSnd = (canvas._dockKey && canvas._dockKey.quitSound) || "quit";
      if (typeof psnd === "function") psnd(quitSnd);
      fetch("/api/system/quit-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: a.bundle || a.name, path: a.path})}).catch(function(){});
    } else {
      // Short tap — launch app
      var snd = (canvas._dockKey && canvas._dockKey.sound) || (profile && profile.defaultSound) || "click";
      if (typeof psnd === "function") psnd(snd);
      fetch("/api/system/launch-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({path: a.path, name: a.name})}).catch(function(){});
    }
  }
}
function _fetchAndDrawDock(canvas) {
  // Clear any existing timer on this canvas
  if (canvas._dockTimer) { clearTimeout(canvas._dockTimer); canvas._dockTimer = null; }
  function _doFetch() {
    fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
      if (d && d.length > 0) { if (!canvas._dockIcons) canvas._dockIcons = {}; _drawDockGrid(canvas, d); }
    }).catch(function(e){ console.log("dock err:",e); })
    .finally(function(){ canvas._dockTimer = setTimeout(_doFetch, 2000); });
  }
  _doFetch();
}
