// ── Dynamic Collection: Dock Panel ──

function _drawDockGrid(canvas, apps) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, w, h);
  
  if (!apps || !apps.length) {
    ctx.fillStyle = "#888";
    ctx.font = Math.max(10, h * 0.12) + "px -apple-system,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("No apps", w/2, h/2);
    canvas._dockApps = []; canvas._dockScroll = 0; canvas._dockMaxScroll = 0;
    return;
  }
  
  var rowH = Math.max(28, Math.min(44, h / 5));
  var visibleRows = Math.floor(h / rowH);
  var totalH = apps.length * rowH;
  canvas._dockMaxScroll = Math.max(0, totalH - h);
  canvas._dockRowH = rowH;
  canvas._dockApps = apps;
  
  // Clamp scroll
  if (!canvas._dockScroll) canvas._dockScroll = 0;
  if (canvas._dockScroll > canvas._dockMaxScroll) canvas._dockScroll = canvas._dockMaxScroll;
  if (canvas._dockScroll < 0) canvas._dockScroll = 0;
  
  // Save context for clipping to visible area
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  
  var scrollY = canvas._dockScroll;
  var fs = Math.max(9, Math.min(rowH * 0.4, w * 0.04));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textBaseline = "middle";
  
  for (var i = 0; i < apps.length; i++) {
    var y = i * rowH - scrollY;
    if (y + rowH < 0 || y > h) continue; // Skip off-screen rows
    
    var a = apps[i];
    // Row background
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, y, w, rowH);
    
    // Running indicator dot
    var dotX = 12, dotY = y + rowH/2;
    ctx.fillStyle = a.running ? "#4ade80" : "#555";
    ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, Math.PI * 2); ctx.fill();
    
    // App name
    ctx.fillStyle = a.running ? "#e8e0d8" : "#8b8078";
    ctx.textAlign = "left";
    ctx.fillText(a.name, 26, dotY);
  }
  
  ctx.restore();
}

function _onDockTap(e, canvas) {
  var rect = canvas.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  var y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  var sc = canvas.width / rect.width;
  x *= sc; y *= sc;
  
  var apps = canvas._dockApps;
  if (!apps || !apps.length) return;
  
  var rowH = canvas._dockRowH || 30;
  var idx = Math.floor((y + canvas._dockScroll) / rowH);
  if (idx >= 0 && idx < apps.length) {
    var app = apps[idx];
    fetch("/api/system/launch-app", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({path: app.path, name: app.name})
    }).catch(function(){});
  }
}

var _dockTouchStartY = 0, _dockTouchStartScroll = 0, _dockTouchMoved = false;

function _onDockTouchStart(e, canvas) {
  var t = e.touches ? e.touches[0] : e;
  _dockTouchStartY = t.clientY;
  _dockTouchStartScroll = canvas._dockScroll || 0;
  _dockTouchMoved = false;
}

function _onDockTouchMove(e, canvas) {
  if (!canvas._dockMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dy = _dockTouchStartY - t.clientY;
  if (Math.abs(dy) > 5) _dockTouchMoved = true;
  canvas._dockScroll = Math.max(0, Math.min(canvas._dockMaxScroll, _dockTouchStartScroll + dy));
  _drawDockGrid(canvas, canvas._dockApps);
}

function _onDockTouchEnd(e, canvas) {
  if (!_dockTouchMoved) {
    _onDockTap(e, canvas);
  }
}

function _fetchAndDrawDock(canvas) {
  fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
    _drawDockGrid(canvas, d);
  }).catch(function(){});
}

function _drawWinShortcuts(canvas) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, w, h);
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

function _drawDockGrid(canvas, apps) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, w, h);
  if (!apps || !apps.length) { ctx.fillStyle = "#888"; ctx.font = "12px -apple-system,sans-serif"; ctx.textAlign = "center"; ctx.fillText("No apps", w/2, h/2); return; }
  var cols = Math.max(3, Math.floor(w / 80));
  var bw = w / cols, bh = Math.max(60, Math.min(90, h / Math.ceil(apps.length / cols)));
  canvas._dockCols = cols; canvas._dockBw = bw; canvas._dockBh = bh; canvas._dockApps = apps;
  ctx.font = Math.max(7, Math.min(bh*0.15, bw*0.12)) + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  apps.forEach(function(a, i) {
    var col = i % cols, row = Math.floor(i / cols);
    var cx = col * bw + bw/2, cy = row * bh;
    // Running indicator
    ctx.fillStyle = a.running ? "#4ade80" : "#555";
    ctx.beginPath(); ctx.arc(cx, cy + 12, 4, 0, Math.PI*2); ctx.fill();
    // Name
    ctx.fillStyle = "#ccc";
    ctx.fillText(a.name, cx, cy + bh - 4);
  });
}

function _onDockTap(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  var y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  var sc = canvas.width / rect.width;
  x *= sc; y *= sc;
  var col = Math.floor(x / canvas._dockBw);
  var row = Math.floor(y / canvas._dockBh);
  var idx = row * canvas._dockCols + col;
  if (canvas._dockApps && canvas._dockApps[idx]) {
    var app = canvas._dockApps[idx];
    fetch("/api/system/launch-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({path: app.path})}).catch(function(){});
  }
}

function _fetchAndDrawDock(canvas) {
  fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
    _drawDockGrid(canvas, d);
  }).catch(function(){});
}

function _drawMenuPanel(canvas, menus) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, w, h);
  if (!menus || !menus.length) { ctx.fillStyle = "#888"; ctx.font = "12px -apple-system,sans-serif"; ctx.textAlign = "center"; ctx.fillText("No menus", w/2, h/2); return; }
  var totalItems = 0; menus.forEach(function(m){ totalItems += m.items.length; });
  var rowH = Math.max(18, Math.min(30, h / totalItems));
  ctx.font = Math.max(7, rowH * 0.4) + "px -apple-system,sans-serif";
  ctx.textBaseline = "middle";
  var y = 4, btnData = [];
  menus.forEach(function(m) {
    ctx.fillStyle = "#f59e0b"; ctx.textAlign = "left";
    ctx.fillText(m.menu, 6, y + rowH/2);
    y += rowH;
    m.items.forEach(function(it) {
      if (y + rowH > h) return;
      btnData.push({y: y, h: rowH, title: it.title, shortcut: it.shortcut});
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(4, y, w-8, rowH);
      ctx.fillStyle = "#ccc"; ctx.textAlign = "left";
      ctx.fillText(it.title, 10, y + rowH/2);
      if (it.shortcut) {
        ctx.fillStyle = "#888"; ctx.textAlign = "right";
        ctx.fillText(it.shortcut, w-8, y + rowH/2);
      }
      y += rowH;
    });
    y += 6;
  });
  canvas._menuBtns = btnData; canvas._menuRowH = rowH;
}

function _onMenuTap(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.width / rect.width);
  var btns = canvas._menuBtns;
  if (!btns) return;
  for (var i = 0; i < btns.length; i++) {
    if (y >= btns[i].y && y < btns[i].y + btns[i].h) {
      var sc = btns[i].shortcut;
      if (sc) fetch("/api/system/execute-shortcut", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({keys: sc})}).catch(function(){});
      break;
    }
  }
}

function _fetchAndDrawMenus(canvas) {
  fetch("/api/system/current-menus").then(function(r){return r.json()}).then(function(d){
    _drawMenuPanel(canvas, d.menus);
  }).catch(function(){});
}

function _drawLayoutPresets(canvas, layouts) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, w, h);
  if (!layouts || !layouts.length) { ctx.fillStyle = "#888"; ctx.font = "12px -apple-system,sans-serif"; ctx.textAlign = "center"; ctx.fillText("No presets - tap + in editor", w/2, h/2); return; }
  var rowH = Math.max(24, Math.min(40, h / Math.max(1, layouts.length)));
  ctx.font = Math.max(8, rowH * 0.35) + "px -apple-system,sans-serif";
  ctx.textBaseline = "middle";
  canvas._lyBtns = [];
  layouts.forEach(function(l, i) {
    var y = 4 + i * rowH;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(4, y, w-8, rowH-2);
    ctx.fillStyle = "#ccc"; ctx.textAlign = "left";
    ctx.fillText(l.name, 10, y + rowH/2);
    // Apply button
    ctx.fillStyle = "#4ade80"; ctx.textAlign = "right";
    ctx.fillText("Apply", w-10, y + rowH/2);
    canvas._lyBtns.push({y: y, h: rowH, name: l.name, action: "apply"});
  });
  canvas._lyRowH = rowH;
}

function _onLayoutTap(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.width / rect.width);
  var btns = canvas._lyBtns;
  if (!btns) return;
  for (var i = 0; i < btns.length; i++) {
    if (y >= btns[i].y && y < btns[i].y + btns[i].h) {
      if (btns[i].action === "apply") {
        fetch("/api/system/layouts/apply", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: btns[i].name})}).catch(function(){});
      }
      break;
    }
  }
}

function _fetchAndDrawLayouts(canvas) {
  fetch("/api/system/layouts").then(function(r){return r.json()}).then(function(d){
    _drawLayoutPresets(canvas, d);
  }).catch(function(){});
}
