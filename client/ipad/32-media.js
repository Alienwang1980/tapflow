// ── Media Control Widgets (volume, mute, mic-mute, audio devices) ──

function _drawVolumeSlider(canvas, value, muted) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  // Only clear slider area (left portion), leave mute area intact
  var muteX = canvas._muteX || (w - h + 2);
  ctx.clearRect(0, 0, muteX - 2, h);
  var sliderW = muteX - 4;
  var margin = 4, barH = Math.max(8, h * 0.35);
  var barY = (h - barH) / 2, barW = sliderW - 8;
  var displayVal = muted ? 0 : value;
  // Background track
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(margin, barY, barW, barH);
  // Fill
  var fillW = barW * (displayVal / 100);
  var g = ctx.createLinearGradient(margin, 0, margin + barW, 0);
  g.addColorStop(0, "#4ade80"); g.addColorStop(1, "#22c55e");
  ctx.fillStyle = muted ? "rgba(239,68,68,0.3)" : g;
  ctx.fillRect(margin, barY, fillW, barH);
  // Knob
  ctx.fillStyle = "#fff"; ctx.beginPath();
  ctx.arc(margin + fillW, barY + barH/2, barH * 0.6, 0, Math.PI*2); ctx.fill();
  // Label
  var fs = Math.max(9, h * 0.3);
  ctx.fillStyle = muted ? "#ef4444" : "#aaa";
  ctx.font = "bold " + fs + "px -apple-system,sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText(muted ? "MUTED" : Math.round(value) + "%", margin, barY - 2);
  canvas._volValue = value; canvas._volMargin = margin; canvas._volBarW = barW;
}

function _drawMuteIcon(canvas, muted) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  var muteW = h - 4;
  var muteX = w - muteW - 2;
  canvas._muteX = muteX; canvas._muteW = muteW;
  ctx.clearRect(muteX - 2, 0, muteW + 4, h);
  // Separator
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(muteX - 1, 4); ctx.lineTo(muteX - 1, h - 4); ctx.stroke();
  // Icon bg
  ctx.fillStyle = muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)";
  ctx.fillRect(muteX, 2, muteW, h - 4);
  // Icon text
  var icx = muteX + muteW/2, icy = h/2;
  ctx.fillStyle = muted ? "#ef4444" : "#888";
  ctx.font = Math.max(8, muteW*0.35) + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("M", icx, icy);
  if (muted) {
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(icx-6, icy-6); ctx.lineTo(icx+6, icy+6); ctx.stroke();
  }
  canvas._volMuted = muted;
}

// ── Volume Slider + Mute (combined widget) ──

function _drawVolume(canvas, value, muted) {
  // Draw mute icon once, only update when mute state changes
  if (canvas._lastMuted !== muted) {
    _drawMuteIcon(canvas, muted);
    canvas._lastMuted = muted;
  }
  // Always draw slider
  _drawVolBar(canvas, value, muted);
  canvas._volValue = value; canvas._volMuted = muted;
}



function _drawVolBar(canvas, value, muted) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  var muteX = canvas._muteX || (w - h + 2);
  ctx.clearRect(0, 0, muteX - 2, h);
  var displayVal = muted ? 0 : value;
  var margin = 4, barH = Math.max(8, h * 0.35);
  var barY = (h - barH) / 2, barW = muteX - margin - 4;
  canvas._volMargin = margin; canvas._volBarW = barW;
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(margin, barY, barW, barH);
  var fillW = barW * (displayVal / 100);
  var g = ctx.createLinearGradient(margin, 0, margin + barW, 0);
  g.addColorStop(0, "#4ade80"); g.addColorStop(1, "#22c55e");
  ctx.fillStyle = muted ? "rgba(239,68,68,0.3)" : g;
  ctx.fillRect(margin, barY, fillW, barH);
  ctx.fillStyle = "#fff"; ctx.beginPath();
  ctx.arc(margin + fillW, barY + barH/2, barH * 0.6, 0, Math.PI*2); ctx.fill();
  var fs = Math.max(9, h * 0.3);
  ctx.fillStyle = muted ? "#ef4444" : "#aaa";
  ctx.font = "bold " + fs + "px -apple-system,sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "bottom";
  ctx.fillText(muted ? "MUTED" : Math.round(value) + "%", margin, barY - 2);
}

function _onVolumeTouchStart(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
  if (x >= (canvas._muteX || 999)) {
    fetch("/api/system/mute", {method:"POST"}).then(function(r){return r.json()}).then(function(d){
      _drawVolume(canvas, canvas._volValue || 50, d.muted);
    }).catch(function(){});
    return;
  }
  canvas._volDragging = true;
  var v = Math.round(((x - canvas._volMargin) / canvas._volBarW) * 100);
  v = Math.max(0, Math.min(100, v));
  canvas._volValue = v;
  canvas._lastMuted = null;
  _drawVolume(canvas, v, false);
}

function _onVolumeTouchMove(e, canvas) {
  e.stopPropagation();
  if (!canvas._volDragging) return;
  var rect = canvas.getBoundingClientRect();
  var x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * (canvas.width / rect.width);
  var v = Math.round(((x - canvas._volMargin) / canvas._volBarW) * 100);
  v = Math.max(0, Math.min(100, v));
  canvas._volValue = v;
  _drawVolBar(canvas, v, false);
}

function _onVolumeTouchEnd(e, canvas) {
  if (canvas._volDragging) {
    canvas._volDragging = false;
    fetch("/api/system/volume", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({value:canvas._volValue||50})}).catch(function(){});
  }
}

function _fetchAndDrawVolume(canvas) {
  canvas._volValue = canvas._volValue || 50;
  canvas._muteX = canvas._muteX || (canvas.width - canvas.height + 2);
  canvas._muteW = canvas._muteW || (canvas.height - 4);
  canvas._lastMuted = null;
  _drawVolume(canvas, canvas._volValue, false);
  fetch("/api/system/volume").then(function(r){return r.json()}).then(function(d){
    canvas._volValue = d.output_volume; canvas._volMuted = d.output_muted;
    canvas._lastMuted = null;
    _drawVolume(canvas, d.output_volume, d.output_muted);
  }).catch(function(){ _drawVolume(canvas, canvas._volValue, false); });
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
