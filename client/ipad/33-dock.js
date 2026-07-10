// ── Dynamic Collection: Dock Panel ──

function _drawDockGrid(canvas, apps) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // transparent background
  
  if (!apps || !apps.length) {
    ctx.fillStyle = "#888";
    ctx.font = Math.max(10, h * 0.12) + "px -apple-system,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("No apps", w/2, h/2);
    canvas._dockApps = []; canvas._dockScroll = 0; canvas._dockMaxScroll = 0;
    return;
  }
  
  // Horizontal layout: icon + label per app
  var iconSize = Math.max(36, Math.min(56, h * 0.6));
  var gap = 8;
  var itemW = iconSize + gap * 2;
  var totalW = apps.length * itemW;
  canvas._dockIconSize = iconSize; canvas._dockItemW = itemW;
  canvas._dockApps = apps;
  canvas._dockMaxScroll = Math.max(0, totalW - w);
  if (!canvas._dockScroll) canvas._dockScroll = 0;
  if (canvas._dockScroll > canvas._dockMaxScroll) canvas._dockScroll = canvas._dockMaxScroll;
  if (canvas._dockScroll < 0) canvas._dockScroll = 0;
  
  var scrollX = canvas._dockScroll;
  var fs = Math.max(7, Math.min(iconSize * 0.2, w * 0.03));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center";
  
  // Track loaded icons
  if (!canvas._dockIcons) canvas._dockIcons = {};
  
  for (var i = 0; i < apps.length; i++) {
    var x = i * itemW - scrollX + gap;
    if (x + iconSize < 0 || x > w) continue;
    var a = apps[i];
    
    // App icon area
    var iconY = (h - iconSize) / 2 - fs - 2;
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(x - 2, iconY - 2, iconSize + 4, iconSize + fs + 8);
    
    // Running indicator
    if (a.running) {
      ctx.fillStyle = "#4ade80";
      ctx.beginPath(); ctx.arc(x + iconSize/2, iconY - 4, 4, 0, Math.PI*2); ctx.fill();
    }
    
    // Draw icon if loaded, else placeholder
    var img = canvas._dockIcons[a.name];
    if (img && img.complete) {
      ctx.drawImage(img, x, iconY, iconSize, iconSize);
    } else {
      ctx.fillStyle = "#555";
      ctx.fillRect(x, iconY, iconSize, iconSize);
      ctx.fillStyle = "#888";
      var initFs = Math.max(14, iconSize * 0.4);
      ctx.font = "bold " + initFs + "px -apple-system,sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(a.name.charAt(0).toUpperCase(), x + iconSize/2, iconY + iconSize/2);
      // Start loading
      if (!canvas._dockIcons[a.name]) {
        var img2 = new Image();
        img2.onload = function() { canvas._dockIcons[a.name] = img2; if(canvas._dockApps) _drawDockGrid(canvas, canvas._dockApps); };
        img2.src = "/api/system/app-icon?name=" + encodeURIComponent(a.name);
        canvas._dockIcons[a.name] = img2;
      }
    }
    
    // App name
    ctx.fillStyle = "#ccc"; ctx.font = fs + "px -apple-system,sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(a.name.substring(0, 10), x + iconSize/2, iconY + iconSize + 2);
  }
}

// Touch handlers for horizontal scroll + tap
var _dockTX = 0, _dockTS = 0, _dockTMoved = false;

function _onDockTouchStart(e, canvas) {
  var t = e.touches ? e.touches[0] : e;
  _dockTX = t.clientX;
  _dockTS = canvas._dockScroll || 0;
  _dockTMoved = false;
}

function _onDockTouchMove(e, canvas) {
  if (!canvas._dockMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dx = _dockTX - t.clientX;
  if (Math.abs(dx) > 5) _dockTMoved = true;
  canvas._dockScroll = Math.max(0, Math.min(canvas._dockMaxScroll, _dockTS + dx));
  _drawDockGrid(canvas, canvas._dockApps);
}

function _onDockTouchEnd(e, canvas) {
  if (_dockTMoved) return;
  var t = e.touches ? e.changedTouches[0] : e;
  var rect = canvas.getBoundingClientRect();
  var x = (t.clientX - rect.left) * (canvas.width / rect.width);
  var idx = Math.floor((x + canvas._dockScroll) / canvas._dockItemW);
  var apps = canvas._dockApps;
  if (apps && idx >= 0 && idx < apps.length) {
    fetch("/api/system/launch-app", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({path: apps[idx].path, name: apps[idx].name})
    }).catch(function(){});
  }
}

function _fetchAndDrawDock(canvas) {
  fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
    if (!d || !d.length) { if(canvas._dockApps && canvas._dockApps.length) return; }
    if (!canvas._dockIcons) canvas._dockIcons = {};
    _drawDockGrid(canvas, d);
  }).catch(function(){});
}



function _drawWinShortcuts(canvas) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // transparent background
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
  // transparent background
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
  // transparent background
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

// ── Dynamic Collection: Audio Devices ──

function _drawAudioDevices(canvas, devices, type) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // transparent background
  
  if (!devices || !devices.length) {
    ctx.fillStyle = "#888";
    ctx.font = Math.max(10, h * 0.12) + "px -apple-system,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("No devices", w/2, h/2);
    canvas._adevDevices = []; canvas._adevScroll = 0;
    return;
  }
  
  var rowH = Math.max(24, Math.min(36, h / 4));
  canvas._adevRowH = rowH; canvas._adevDevices = devices; canvas._adevType = type;
  canvas._adevMaxScroll = Math.max(0, devices.length * rowH - h);
  if (!canvas._adevScroll) canvas._adevScroll = 0;
  if (canvas._adevScroll > canvas._adevMaxScroll) canvas._adevScroll = canvas._adevMaxScroll;
  
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  
  var scrollY = canvas._adevScroll;
  var fs = Math.max(8, Math.min(rowH * 0.4, w * 0.04));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textBaseline = "middle";
  
  for (var i = 0; i < devices.length; i++) {
    var y = i * rowH - scrollY;
    if (y + rowH < 0 || y > h) continue;
    var d = devices[i];
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(0, y, w, rowH);
    
    var dotX = 10, dotY = y + rowH/2;
    ctx.fillStyle = d.current ? "#4ade80" : "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = d.current ? "#e8e0d8" : "#8b8078";
    ctx.textAlign = "left";
    ctx.fillText(d.name, 22, dotY);
  }
  ctx.restore();
}

var _adevTouchStartY = 0, _adevTouchStartScroll = 0, _adevTouchMoved = false;

function _onAudioDevTouchStart(e, canvas) {
  var t = e.touches ? e.touches[0] : e;
  _adevTouchStartY = t.clientY;
  _adevTouchStartScroll = canvas._adevScroll || 0;
  _adevTouchMoved = false;
}

function _onAudioDevTouchMove(e, canvas) {
  if (!canvas._adevMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dy = _adevTouchStartY - t.clientY;
  if (Math.abs(dy) > 3) _adevTouchMoved = true;
  canvas._adevScroll = Math.max(0, Math.min(canvas._adevMaxScroll, _adevTouchStartScroll + dy));
  _drawAudioDevices(canvas, canvas._adevDevices, canvas._adevType);
}

function _onAudioDevTouchEnd(e, canvas) {
  if (_adevTouchMoved) return;
  var rect = canvas.getBoundingClientRect();
  var y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.width / rect.width);
  var idx = Math.floor((y + canvas._adevScroll) / canvas._adevRowH);
  var devs = canvas._adevDevices;
  if (devs && idx >= 0 && idx < devs.length && !devs[idx].current) {
    var ep = canvas._adevType === "input" ? "/api/system/audio-input" : "/api/system/audio-output";
    fetch(ep, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: devs[idx].name})})
      .then(function(){ _fetchAndDrawAudioDevs(canvas, canvas._adevType); });
  }
}

function _fetchAndDrawAudioDevs(canvas, type) {
  canvas._adevType = type;
  fetch("/api/system/audio-devices").then(function(r){return r.json()}).then(function(d){
    var filtered = d.filter(function(dev){ return dev.type === type; });
    _drawAudioDevices(canvas, filtered, type);
  }).catch(function(){});
}

// ── Dynamic Collection: Layout Presets ──

function _drawLayoutPresets(canvas, layouts) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // transparent background
  
  if (!layouts || !layouts.length) {
    ctx.fillStyle = "#888";
    ctx.font = Math.max(10, h * 0.12) + "px -apple-system,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("No presets", w/2, h/2);
    canvas._lyItems = []; canvas._lyScroll = 0;
    return;
  }
  
  var rowH = Math.max(28, Math.min(40, h / 5));
  canvas._lyRowH = rowH; canvas._lyItems = layouts;
  canvas._lyMaxScroll = Math.max(0, layouts.length * rowH - h);
  if (!canvas._lyScroll) canvas._lyScroll = 0;
  if (canvas._lyScroll > canvas._lyMaxScroll) canvas._lyScroll = canvas._lyMaxScroll;
  
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  
  var scrollY = canvas._lyScroll;
  var fs = Math.max(8, Math.min(rowH * 0.38, w * 0.04));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textBaseline = "middle";
  
  for (var i = 0; i < layouts.length; i++) {
    var y = i * rowH - scrollY;
    if (y + rowH < 0 || y > h) continue;
    var l = layouts[i];
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, y, w, rowH);
    
    ctx.fillStyle = "#ccc"; ctx.textAlign = "left";
    ctx.fillText(l.name, 8, y + rowH/2);
    
    // Apply button
    var bw = w * 0.25, bh = rowH * 0.7, bx = w - bw - 8, by = y + (rowH - bh)/2;
    ctx.fillStyle = "rgba(74,222,128,0.15)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#4ade80"; ctx.textAlign = "center";
    ctx.fillText("Apply", bx + bw/2, by + bh/2);
  }
  ctx.restore();
}

function _onLayoutTap(e, canvas) {
  var rect = canvas.getBoundingClientRect();
  var y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.width / rect.width);
  var idx = Math.floor((y + canvas._lyScroll) / canvas._lyRowH);
  var items = canvas._lyItems;
  if (items && idx >= 0 && idx < items.length) {
    fetch("/api/system/layouts/apply", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: items[idx].name})}).catch(function(){});
  }
}

var _lyTouchStartY = 0, _lyTouchStartScroll = 0, _lyTouchMoved = false;

function _onLayoutTouchStart(e, canvas) {
  var t = e.touches ? e.touches[0] : e;
  _lyTouchStartY = t.clientY;
  _lyTouchStartScroll = canvas._lyScroll || 0;
  _lyTouchMoved = false;
}

function _onLayoutTouchMove(e, canvas) {
  if (!canvas._lyMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dy = _lyTouchStartY - t.clientY;
  if (Math.abs(dy) > 3) _lyTouchMoved = true;
  canvas._lyScroll = Math.max(0, Math.min(canvas._lyMaxScroll, _lyTouchStartScroll + dy));
  _drawLayoutPresets(canvas, canvas._lyItems);
}

function _onLayoutTouchEnd(e, canvas) {
  if (!_lyTouchMoved) _onLayoutTap(e, canvas);
}

function _fetchAndDrawLayouts(canvas) {
  fetch("/api/system/layouts").then(function(r){return r.json()}).then(function(d){
    _drawLayoutPresets(canvas, d);
  }).catch(function(){});
}
