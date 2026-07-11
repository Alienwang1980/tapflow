// ── Media Control Widgets (volume, mute, mic-mute, audio devices) ──

function _drawVolume(canvas, value, muted) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  // Mute button area (right side, square)
  var muteW = h - 4;
  var muteX = w - muteW - 2;
  var muteY = 2;
  var sliderW = muteX - 4;
  // Separator line
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(muteX - 1, 4); ctx.lineTo(muteX - 1, h - 4); ctx.stroke();
  // Mute icon
  var icx = muteX + muteW/2, icy = h/2;
  if (muted) {
    ctx.fillStyle = "rgba(239,68,68,0.2)";
    ctx.fillRect(muteX, muteY, muteW, muteW);
    ctx.fillStyle = "#ef4444";
  } else {
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(muteX, muteY, muteW, muteW);
    ctx.fillStyle = "#888";
  }
  ctx.font = Math.max(8, muteW*0.35) + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(muted ? "M" : "M", icx, icy);
  if (muted) {
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(icx-8, icy-8); ctx.lineTo(icx+8, icy+8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(icx+8, icy-8); ctx.lineTo(icx-8, icy+8); ctx.stroke();
  }
  canvas._muteX = muteX; canvas._muteW = muteW;
  // Slider
  if (muted) value = 0;
  var margin = 4, barH = Math.max(8, h * 0.3);
  var barY = (h - barH) / 2, barW = sliderW - 8;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(margin, barY, barW, barH);
  var fillW = barW * (value / 100);
  var g = ctx.createLinearGradient(margin, 0, margin + barW, 0);
  g.addColorStop(0, "#4ade80"); g.addColorStop(1, "#22c55e");
  ctx.fillStyle = muted ? "#ef4444" : g;
  ctx.fillRect(margin, barY, fillW, barH);
  var hx = margin + fillW, hy = barY + barH / 2;
  ctx.fillStyle = "#fff"; ctx.beginPath();
  ctx.arc(hx, hy, barH * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; var fs = Math.max(10, h * 0.3);
  ctx.font = "bold " + fs + "px -apple-system,sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(muted ? "MUTED" : Math.round(value) + "%", margin, barY - fs - 4);
  ctx.font = fs * 0.8 + "px -apple-system,sans-serif";
  ctx.textAlign = "right"; ctx.fillText(muted ? "MUTE" : "VOL", w - margin, barY - fs - 4);
  canvas._volValue = value; canvas._volMuted = muted;
  canvas._volMargin = margin; canvas._volBarW = barW;
}

function _onVolumeTouchStart(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
  var y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * (canvas.height / rect.height);
  // Device selector area
  if (canvas._devBtns && y >= (canvas._devY || 999)) {
    for (var di = 0; di < canvas._devBtns.length; di++) {
      var db = canvas._devBtns[di];
      if (db && x >= db.x && x <= db.x + db.w && y >= db.y && y <= db.y + db.h) {
        fetch("/api/system/audio-output", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name:db.name})}).catch(function(){});
        return;
      }
    }
    return;
  }
  // Mute button
  if (x >= (canvas._muteX || 999) && y < (canvas._devY || 999)) {
    fetch("/api/system/mute", {method:"POST"}).then(function(r){return r.json()}).then(function(d){
      canvas._volMuted = d.muted;
      _drawVolume(canvas, canvas._volValue || 50, d.muted, canvas._adevs, canvas._curDev);
    }).catch(function(){});
    return;
  }
  // Slider drag start
  canvas._volDragging = true;
  var v = Math.round(((x - canvas._volMargin) / canvas._volBarW) * 100);
  v = Math.max(0, Math.min(100, v));
  canvas._volValue = v;
  _drawVolume(canvas, v, !!canvas._volMuted, canvas._adevs, canvas._curDev);
  fetch("/api/system/volume", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({value:v})}).catch(function(){});
}

function _onVolumeTouchMove(e, canvas) {
  e.stopPropagation();
  if (!canvas._volDragging) return;
  var rect = canvas.getBoundingClientRect();
  var x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
  var v = Math.round(((x - canvas._volMargin) / canvas._volBarW) * 100);
  v = Math.max(0, Math.min(100, v));
  canvas._volValue = v;
  _drawVolume(canvas, v, !!canvas._volMuted, canvas._adevs, canvas._curDev);
  fetch("/api/system/volume", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({value:v})}).catch(function(){});
}

function _onVolumeTouchEnd(e, canvas) {
  canvas._volDragging = false;
}

function _fetchAndDrawVolume(canvas) {
  canvas._volValue = canvas._volValue || 50;
  canvas._volMuted = canvas._volMuted || false;
  canvas._volMargin = 4; canvas._volBarW = canvas.width - 8;
  _drawVolume(canvas, canvas._volValue, canvas._volMuted, canvas._adevs, canvas._curDev);
  // Fetch volume
  fetch("/api/system/volume").then(function(r){return r.json()}).then(function(d){
    canvas._volValue = d.output_volume; canvas._volMuted = d.output_muted;
    _drawVolume(canvas, d.output_volume, d.output_muted, canvas._adevs, canvas._curDev);
  }).catch(function(){});
  // Fetch audio devices
  fetch("/api/system/audio-devices").then(function(r){return r.json()}).then(function(devs){
    canvas._adevs = devs;
    var cur = devs.find(function(d){return d.current && d.type==="output"});
    canvas._curDev = cur ? cur.name : "";
    _drawVolume(canvas, canvas._volValue, canvas._volMuted, devs, canvas._curDev);
  }).catch(function(){});
}

function _drawMuteBtn(canvas, muted) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = muted ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = muted ? "#ef4444" : "#888";
  var r = Math.min(w, h) * 0.35;
  ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; var fs = Math.max(14, Math.min(w, h) * 0.4);
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("M", w / 2, h / 2);
  canvas._muted = muted;
}

function _toggleMute(canvas) {
  fetch("/api/system/mute", { method: "POST" }).then(function (r) { return r.json(); }).then(function (d) {
    _drawMuteBtn(canvas, d.muted);
  });
}

function _drawCurrentApp(canvas, name) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "transparent"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#888"; var fs = Math.max(9, Math.min(h*0.18, w*0.05));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  ctx.fillText("Mac:", w*0.35, h/2);
  ctx.fillStyle = "#fff"; var fs2 = Math.max(10, Math.min(h*0.22, w*0.06));
  ctx.font = "bold " + fs2 + "px -apple-system,sans-serif";
  ctx.textAlign = "left"; ctx.fillText(name || "?", w*0.4, h/2);
}
function _fetchAndDrawCurrentApp(canvas) {
  fetch("/api/system/current-app").then(function(r){return r.json()}).then(function(d){
    _drawCurrentApp(canvas, d.name);
  }).catch(function(){_drawCurrentApp(canvas,"?")});
}

function _drawMicMuteBtn(canvas, muted, level) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  var cx = w/2, cy = h/2;
  var baseR = Math.min(w, h) * 0.32; // base button radius
  var lvl = level || 0;

  // Expanding halo rings (up to 3 rings based on level)
  for (var ring = 0; ring < 3; ring++) {
    var threshold = ring * 0.33;
    var ringAlpha = Math.max(0, Math.min(1, (lvl - threshold) / 0.33));
    if (ringAlpha > 0.01) {
      var ringR = baseR + 4 + ring * 8 + ringAlpha * 6;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = muted ? "rgba(239,68,68," + (0.15 + ringAlpha * 0.4) + ")" : "rgba(74,222,128," + (0.15 + ringAlpha * 0.4) + ")";
      ctx.lineWidth = 2 + ringAlpha * 1.5;
      ctx.stroke();
    }
  }

  // Button background circle
  ctx.beginPath();
  ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
  ctx.fillStyle = muted ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)";
  ctx.fill();

  // Button border
  ctx.beginPath();
  ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
  ctx.strokeStyle = muted ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  var r = Math.min(w, h) * 0.35;
  ctx.beginPath(); ctx.arc(w/2, h/2, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#fff"; var fs = Math.max(14, Math.min(w, h)*0.4);
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("M", w/2, h/2);
  canvas._micMuted = muted;
}
function _toggleMicMute(canvas) {
  fetch("/api/system/mic-mute", {method:"POST"}).then(function(r){return r.json()}).then(function(d){
    _drawMicMuteBtn(canvas, d.muted, canvas._micLevel||0);
  });
}
function _pollMicLevel(canvas) {
  fetch("/api/system/mic-level").then(function(r){return r.json()}).then(function(d){
    canvas._micLevel = d.level;
    _drawMicMuteBtn(canvas, canvas._micMuted||false, d.level);
  }).catch(function(){});
}
