// ── System Widgets (Window, Dock, Menu, Layout) ──

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
