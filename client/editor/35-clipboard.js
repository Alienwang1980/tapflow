// ── Clipboard Panel ──

function _updateClipboardPanel() {
  var panel = document.getElementById("rp-clipboard-section");
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
  var k = data.keys[0];
  var count = data.keys.length;
  // Draw actual button preview to scale
  var size = Math.min(preview.clientWidth || 180, preview.clientHeight || 180);
  var cv = document.createElement("canvas");
  cv.width = size * 2; cv.height = size * 2; // 2x for retina
  cv.style.width = size + "px"; cv.style.height = size + "px";
  cv.style.borderRadius = "6px";
  var ctx = cv.getContext("2d");
  ctx.scale(2, 2);
  // Render like actual key button
  var brPct = (k.borderRadius !== undefined ? k.borderRadius : 10) / 100;
  var br = brPct * size;
  var bg = k.color || "#0f3460";
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(br, 0); ctx.lineTo(size - br, 0);
  ctx.arcTo(size, 0, size, br, br);
  ctx.lineTo(size, size - br); ctx.arcTo(size, size, size - br, size, br);
  ctx.lineTo(br, size); ctx.arcTo(0, size, 0, size - br, br);
  ctx.lineTo(0, br); ctx.arcTo(0, 0, br, 0, br);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = k.fontColor || "#fff";
  var fs = Math.max(8, size * 0.2);
  ctx.font = "bold " + fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  var label = k.label || k.action || "?";
  if (label.length > 4) label = label.substring(0,4);
  ctx.fillText(label, size/2, size/2);
  preview.innerHTML = "";
  preview.appendChild(cv);
  preview.style.cursor = "grab";
  preview.draggable = true;
  preview.dataset.clipboard = "1";
  // Attach drag handler
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

