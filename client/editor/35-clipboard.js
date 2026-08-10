// ── Clipboard Panel ──

function _updateClipboardPanel() {
  var panel = document.getElementById("rp-clipboard");
  if (!panel) return;
  var data = _getClipboard();
  var preview = panel.querySelector(".clip-preview");
  if (!data || !data.keys || !data.keys.length) {
    preview.innerHTML = '<div style="color:var(--dim);font-size:11px;text-align:center;padding:30px 0">Empty</div>';
    preview.style.cursor = "default";
    preview.draggable = false;
    delete preview.dataset.clipboard;
    return;
  }
  var keys = data.keys;
  // Calculate bounding box in grid units (col, row, w, h)
  var minC = Infinity, minR = Infinity, maxC = -Infinity, maxR = -Infinity;
  keys.forEach(function(k) {
    var kc = k.col != null ? k.col : 0;
    var kr = k.row != null ? k.row : 0;
    var kw = k.w || 1;
    var kh = k.h || 1;
    if (kc < minC) minC = kc;
    if (kr < minR) minR = kr;
    if (kc + kw > maxC) maxC = kc + kw;
    if (kr + kh > maxR) maxR = kr + kh;
  });
  var bw = maxC - minC; // total width in grid units
  var bh = maxR - minR; // total height in grid units
  // Square preview size
  var size = Math.min(preview.clientWidth || 180, preview.clientHeight || 180, 160);
  var pad = 8; // padding inside preview
  var drawW = size - pad * 2;
  var drawH = size - pad * 2;
  // Scale to fit within the square, preserving aspect ratio
  var cellPx = 60; // approximate pixels per grid unit
  var scale = Math.min(drawW / (bw * cellPx), drawH / (bh * cellPx), 1.5);
  var keyPx = cellPx * scale;
  var ox = pad + (drawW - bw * keyPx) / 2;
  var oy = pad + (drawH - bh * keyPx) / 2;
  // Draw to retina canvas
  var cv = document.createElement("canvas");
  cv.width = size * 2; cv.height = size * 2;
  cv.style.width = size + "px"; cv.style.height = size + "px";
  cv.style.borderRadius = "6px";
  var ctx = cv.getContext("2d");
  ctx.scale(2, 2);
  // Background
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, size, size);
  // Draw each key
  keys.forEach(function(k) {
    var kx = ox + ((k.col != null ? k.col : 0) - minC) * keyPx;
    var ky = oy + ((k.row != null ? k.row : 0) - minR) * keyPx;
    var kw = (k.w || 1) * keyPx;
    var kh = (k.h || 1) * keyPx;
    var gap = 2 * scale;
    kx += gap; ky += gap; kw -= gap * 2; kh -= gap * 2;
    if (kw < 4 || kh < 4) return;
    // Border radius
    var brPct = (k.borderRadius !== undefined ? k.borderRadius : 10) / 100;
    var br = brPct * Math.min(kw, kh);
    // Key background
    var bg = k.color || "#0f3460";
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(kx + br, ky); ctx.lineTo(kx + kw - br, ky);
    ctx.arcTo(kx + kw, ky, kx + kw, ky + br, Math.min(br, kw/2));
    ctx.lineTo(kx + kw, ky + kh - br); ctx.arcTo(kx + kw, ky + kh, kx + kw - br, ky + kh, Math.min(br, kh/2));
    ctx.lineTo(kx + br, ky + kh); ctx.arcTo(kx, ky + kh, kx, ky + kh - br, Math.min(br, kh/2));
    ctx.lineTo(kx, ky + br); ctx.arcTo(kx, ky, kx + br, ky, Math.min(br, kw/2));
    ctx.closePath(); ctx.fill();
    // Label
    ctx.fillStyle = k.fontColor || "#fff";
    var fs = Math.max(6, Math.min(kh * 0.3, kw * 0.15));
    ctx.font = "bold " + fs + "px -apple-system,sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    var lbl = k.label || "";
    if (lbl.length > 6) lbl = lbl.substring(0,5);
    ctx.fillText(lbl, kx + kw/2, ky + kh/2);
  });
  preview.innerHTML = "";
  preview.appendChild(cv);
  preview.style.cursor = "grab";
  preview.draggable = true;
  preview.dataset.clipboard = "1";
  if (!preview._hasDrag) {
    preview._hasDrag = true;
    preview.addEventListener("dragstart", function(e) {
      e.dataTransfer.setData("text/plain", "__clipboard__");
      e.dataTransfer.effectAllowed = "copy";
    });
  }
}


function _getClipboard() {
  try {
    return JSON.parse(localStorage.getItem("stp_clipboard") || "null");
  } catch(e) { return null; }
}

function _setClipboard(keys) {
  // Store with new IDs for paste uniqueness, preserve col/row for relative positioning
  var stored = keys.map(function(k) {
    var clone = JSON.parse(JSON.stringify(k));
    // Ensure col/row are stored (may be missing for unsaved keys)
    if (clone.col == null) clone.col = 0;
    if (clone.row == null) clone.row = 0;
    clone._originalId = clone.id;
    delete clone.id;
    return clone;
  });
  localStorage.setItem("stp_clipboard", JSON.stringify({keys: stored, count: stored.length, ts: Date.now()}));
  _updateClipboardPanel();
}

function _copyToClipboard() {
  var page = cp_();
  if (!page) return;
  var selected = [];
  if (selKeys.size > 0) {
    page.keys.forEach(function(k) {
      if (selKeys.has(k.id)) selected.push(_snapshot(k));
    });
  } else if (selKey) {
    var k = page.keys.find(function(x) { return x.id === selKey; });
    if (k) selected.push(_snapshot(k));
  }
  if (!selected.length) return;
  _setClipboard(selected);
  t("Copied " + selected.length + " key" + (selected.length > 1 ? "s" : ""));
}

function _pasteFromClipboard(col, row) {
  var data = _getClipboard();
  if (!data || !data.keys || !data.keys.length) return null;
  var page = cp_();
  if (!page) return null;
  // Calculate relative offsets from bounding box origin
  var minCol = Infinity, minRow = Infinity;
  data.keys.forEach(function(k) {
    var kc = k.col != null ? k.col : 0;
    var kr = k.row != null ? k.row : 0;
    if (kc < minCol) minCol = kc;
    if (kr < minRow) minRow = kr;
  });
  var pasted = [];
  data.keys.forEach(function(k, i) {
    var clone = JSON.parse(JSON.stringify(k));
    delete clone._originalId;
    clone.id = "k_" + Date.now() + "_" + i;
    // Preserve relative position from bounding box origin
    clone.col = col + ((k.col != null ? k.col : 0) - minCol);
    clone.row = row + ((k.row != null ? k.row : 0) - minRow);
    if (clone.groups) clone.groups = clone.groups.slice();
    page.keys.push(clone);
    pasted.push(clone);
  });
  dirty = true;
  rr(); rpr();
  t("Pasted " + pasted.length + " key" + (pasted.length > 1 ? "s" : ""));
  return pasted;
}

// Update panel on init
setTimeout(_updateClipboardPanel, 500);
// ── Props ──
