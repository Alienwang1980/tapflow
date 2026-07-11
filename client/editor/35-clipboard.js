// ── Clipboard Panel ──

function _updateClipboardPanel() {
  var panel = document.getElementById("rp-clipboard");
  if (!panel) return;
  var data = _getClipboard();
  var preview = panel.querySelector(".clip-preview");
  if (!data || !data.keys || !data.keys.length) {
    preview.innerHTML = '<div style="color:var(--dim);font-size:11px;text-align:center;padding:20px 0">Select keys and click Copy</div>';
    preview.style.cursor = "default";
    preview.draggable = false;
    return;
  }
  var k = data.keys[0];
  var count = data.keys.length;
  var label = count > 1 ? (count + " keys") : (k.label || "Key");
  // Draw a mini preview canvas
  var cv = document.createElement("canvas");
  cv.width = preview.clientWidth || 180;
  cv.height = 48;
  cv.style.width = "100%";
  cv.style.borderRadius = "4px";
  var ctx = cv.getContext("2d");
  ctx.fillStyle = k.color || "#0f3460";
  _drawKeyPreview(ctx, cv.width, cv.height, k, count);
  preview.innerHTML = "";
  preview.appendChild(cv);
  preview.style.cursor = "grab";
  preview.draggable = true;
  preview.dataset.clipboard = "1";
}

function _drawKeyPreview(ctx, w, h, k, count) {
  var br = ((k.borderRadius !== undefined ? k.borderRadius : 10) / 100) * Math.min(w, h);
  // Rounded rect background
  ctx.fillStyle = k.color || "#0f3460";
  ctx.beginPath();
  ctx.moveTo(br, 0); ctx.lineTo(w - br, 0);
  ctx.arcTo(w, 0, w, br, br);
  ctx.lineTo(w, h - br); ctx.arcTo(w, h, w - br, h, br);
  ctx.lineTo(br, h); ctx.arcTo(0, h, 0, h - br, br);
  ctx.lineTo(0, br); ctx.arcTo(0, 0, br, 0, br);
  ctx.closePath(); ctx.fill();
  // Label
  ctx.fillStyle = k.fontColor || "#fff";
  var fs = Math.max(8, h * 0.3);
  ctx.font = "bold " + fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(count > 1 ? (count + " keys") : (k.label || k.action || "Key"), w/2, h/2);
}

function _getClipboard() {
  try {
    return JSON.parse(localStorage.getItem("stp_clipboard") || "null");
  } catch(e) { return null; }
}

function _setClipboard(keys) {
  // Store with new IDs for paste uniqueness
  var stored = keys.map(function(k) {
    var clone = JSON.parse(JSON.stringify(k));
    clone._originalId = clone.id;
    delete clone.id; // Will get new ID on paste
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
  var pasted = [];
  data.keys.forEach(function(k, i) {
    var clone = JSON.parse(JSON.stringify(k));
    clone.id = "k_" + Date.now() + "_" + i;
    clone.col = col + (i % 3) * 0.5;
    clone.row = row + Math.floor(i / 3) * 0.5;
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

// Add clipboard drag support
document.addEventListener("DOMContentLoaded", function() {
  var preview = document.querySelector("#rp-clipboard .clip-preview");
  if (preview) {
    preview.addEventListener("dragstart", function(e) {
      if (!preview.dataset.clipboard) { e.preventDefault(); return; }
      e.dataTransfer.setData("text/plain", "__clipboard__");
      e.dataTransfer.effectAllowed = "copy";
    });
  }
});
