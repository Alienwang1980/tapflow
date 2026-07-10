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
    if (a.running) {
      ctx.fillStyle = "#4ade80";
      ctx.beginPath(); ctx.arc(x + iconSize/2, iconY - 4, 4, 0, Math.PI*2); ctx.fill();
    }
    if (!canvas._dockIcons) canvas._dockIcons = {};
    var img = canvas._dockIcons[a.name];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, x, iconY, iconSize, iconSize);
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
        img2.src = "/api/system/app-icon?path=" + encodeURIComponent(a.path || "");
        canvas._dockIcons[a.name] = img2;
      }
    }
    ctx.fillStyle = "#ccc"; ctx.font = fs + "px -apple-system,sans-serif";
    ctx.textBaseline = "top";
    var label = a.name.length > 8 ? a.name.substring(0,7)+".." : a.name;
    ctx.fillText(label, x + iconSize/2, iconY + iconSize + 2);
  }
}

var _dockTX = 0, _dockTS = 0, _dockTMoved = false;
function _onDockTouchStart(e, canvas) {
  var t = e.touches ? e.touches[0] : e;
  _dockTX = t.clientX; _dockTS = canvas._dockScroll || 0; _dockTMoved = false;
}
function _onDockTouchMove(e, canvas) {
  if (!canvas._dockMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dx = _dockTX - t.clientX;
  if (Math.abs(dx) > 4) _dockTMoved = true;
  canvas._dockScroll = Math.max(0, Math.min(canvas._dockMaxScroll, _dockTS + dx));
  _drawDockGrid(canvas, canvas._dockApps);
}
function _onDockTouchEnd(e, canvas) {
  if (_dockTMoved) return;
  var t = e.touches ? e.changedTouches[0] : e;
  var rect = canvas.getBoundingClientRect();
  var x = (t.clientX - rect.left) * (canvas.width / rect.width);
  var idx = Math.floor((x + canvas._dockScroll) / canvas._dockItemW);
  if (canvas._dockApps && idx >= 0 && idx < canvas._dockApps.length) {
    var a = canvas._dockApps[idx];
    fetch("/api/system/launch-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({path: a.path, name: a.name})}).catch(function(){});
  }
}
function _fetchAndDrawDock(canvas) {
  fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
    if (d && d.length > 0) { if (!canvas._dockIcons) canvas._dockIcons = {}; _drawDockGrid(canvas, d); }
  }).catch(function(){});
  // Redraw periodically to pick up loaded icons
  if (!canvas._dockRedrawTimer) canvas._dockRedrawTimer = setInterval(function(){
    if (canvas._dockApps && canvas._dockApps.length) _drawDockGrid(canvas, canvas._dockApps);
  }, 2000);
}
