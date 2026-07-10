// ── Media Control Widgets (volume, mute, mic-mute, audio devices) ──

function _drawVolume(canvas, value, muted) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "transparent"; ctx.fillRect(0, 0, w, h);
  if (muted) value = 0;
  var margin = w * 0.08, barH = Math.max(8, h * 0.25);
  var barY = (h - barH) / 2, barW = w - margin * 2;
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

function _onVolumeTouch(e, canvas) {
  e.stopPropagation();
  var rect = canvas.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  var scale = canvas.width / rect.width;
  x *= scale;
  var v = Math.round(((x - canvas._volMargin) / canvas._volBarW) * 100);
  v = Math.max(0, Math.min(100, v));
  _drawVolume(canvas, v, false);
  fetch("/api/system/volume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: v }) }).catch(function () { });
}

function _fetchAndDrawVolume(canvas) {
  fetch("/api/system/volume").then(function (r) { return r.json(); }).then(function (d) {
    _drawVolume(canvas, d.output_volume, d.output_muted);
  }).catch(function () { _drawVolume(canvas, 75, false); });
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
