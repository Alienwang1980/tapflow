// ── Media Control Widgets (volume, mute, mic-mute, audio devices) ──

// ── Volume Widget — full-surface progress bar, mute on left, H/V layout ──
function _drawVolumeWidget(canvas,value,muted,layout){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);var isVert=layout==="vertical";var pad=Math.max(5,isVert?w*0.08:h*0.06);var muteR=Math.min(isVert?w*0.25:h*0.28,isVert?w*0.11:h*0.12);muteR=Math.max(14,Math.min(muteR,34));var pct=muted?0:Math.round(value);ctx.fillStyle="rgba(255,255,255,0.04)";ctx.fillRect(0,0,w,h);if(isVert){var muteCX=w/2;var muteCY=h-pad-muteR;canvas._muteCX=muteCX;canvas._muteCY=muteCY;canvas._muteR=muteR;var fillH=muted?0:h*(pct/100);var g=ctx.createLinearGradient(0,h,0,0);g.addColorStop(0,"rgba(74,222,128,0.30)");g.addColorStop(1,"rgba(34,197,94,0.22)");if(fillH>0){ctx.fillStyle=g;ctx.fillRect(0,h-fillH,w,fillH)}var numFs=Math.max(20,Math.min(h*0.40,w*0.18));ctx.fillStyle=muted?"rgba(239,68,68,0.7)":"rgba(255,255,255,0.9)";ctx.font="bold "+numFs+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(pct+"%",w/2,h*0.38);var labelFs=Math.max(7,Math.min(h*0.09,w*0.05));ctx.fillStyle="rgba(255,255,255,0.3)";ctx.font=labelFs+"px -apple-system,sans-serif";ctx.textBaseline="top";ctx.fillText("VOL",w/2,h*0.38+numFs*0.5+3)}else{var muteCX=pad+muteR;var muteCY=h/2;canvas._muteCX=muteCX;canvas._muteCY=muteCY;canvas._muteR=muteR;var fillW=muted?0:w*(pct/100);if(fillW>0){var g2=ctx.createLinearGradient(0,0,w,0);g2.addColorStop(0,"rgba(74,222,128,0.30)");g2.addColorStop(1,"rgba(34,197,94,0.22)");ctx.fillStyle=g2;ctx.fillRect(0,0,fillW,h)}var numFs2=Math.max(22,Math.min(h*0.48,w*0.16));ctx.fillStyle=muted?"rgba(239,68,68,0.7)":"rgba(255,255,255,0.9)";ctx.font="bold "+numFs2+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(pct+"%",w/2,h*0.40);var labelFs2=Math.max(8,Math.min(h*0.10,w*0.04));ctx.fillStyle="rgba(255,255,255,0.3)";ctx.font=labelFs2+"px -apple-system,sans-serif";ctx.textBaseline="top";ctx.fillText("VOLUME",w/2,h*0.40+numFs2*0.5+4)}ctx.beginPath();ctx.arc(muteCX,muteCY,muteR,0,Math.PI*2);ctx.fillStyle=muted?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.06)";ctx.fill();ctx.beginPath();ctx.arc(muteCX,muteCY,muteR,0,Math.PI*2);ctx.strokeStyle=muted?"rgba(239,68,68,0.45)":"rgba(255,255,255,0.14)";ctx.lineWidth=1.2;ctx.stroke();var isz=muteR*1.15;_drawSpeakerIcon(ctx,muteCX-isz/2,muteCY-isz/2,isz,muted);canvas._volPad=0;canvas._volBarLen=isVert?h:w;canvas._volLayout=layout||"horizontal";canvas._volValue=value;canvas._volMuted=muted}
function _drawSpeakerIcon(ctx,x,y,sz,muted){var s=sz;ctx.fillStyle=muted?"#ef4444":"#999";ctx.fillRect(x+s*0.10,y+s*0.28,s*0.20,s*0.44);ctx.beginPath();ctx.moveTo(x+s*0.30,y+s*0.20);ctx.lineTo(x+s*0.55,y+s*0.08);ctx.lineTo(x+s*0.55,y+s*0.92);ctx.lineTo(x+s*0.30,y+s*0.80);ctx.closePath();ctx.fill();if(!muted){ctx.strokeStyle="#999";ctx.lineWidth=Math.max(1,s*0.05);ctx.beginPath();ctx.arc(x+s*0.52,y+s*0.5,s*0.20,-0.40,0.40);ctx.stroke();ctx.beginPath();ctx.arc(x+s*0.52,y+s*0.5,s*0.32,-0.40,0.40);ctx.stroke()}if(muted){ctx.strokeStyle="#ef4444";ctx.lineWidth=Math.max(1.2,s*0.07);ctx.beginPath();ctx.moveTo(x+s*0.48,y+s*0.24);ctx.lineTo(x+s*0.68,y+s*0.78);ctx.moveTo(x+s*0.68,y+s*0.24);ctx.lineTo(x+s*0.48,y+s*0.78);ctx.stroke()}}
function _onVolumeTouchStart(e,canvas){e.stopPropagation();var rect=canvas.getBoundingClientRect();var tx=((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*(canvas.width/rect.width);var ty=((e.touches?e.touches[0].clientY:e.clientY)-rect.top)*(canvas.height/rect.height);var dcx=tx-canvas._muteCX,dcy=ty-canvas._muteCY;if(Math.sqrt(dcx*dcx+dcy*dcy)<canvas._muteR+6){fetch("/api/system/mute",{method:"POST"}).then(function(r){return r.json()}).then(function(d){_drawVolumeWidget(canvas,canvas._volValue||50,d.muted,canvas._volLayout)}).catch(function(){});return}canvas._volDragging=true;var isVert2=canvas._volLayout==="vertical";var pos=isVert2?ty:tx;var v=Math.round((1-(isVert2?pos/canvas._volBarLen:pos/canvas._volBarLen))*100);v=Math.max(0,Math.min(100,v));canvas._volValue=v;_drawVolumeWidget(canvas,v,false,canvas._volLayout)}
function _onVolumeTouchMove(e,canvas){e.stopPropagation();if(!canvas._volDragging)return;var rect=canvas.getBoundingClientRect();var tx=((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*(canvas.width/rect.width);var ty=((e.touches?e.touches[0].clientY:e.clientY)-rect.top)*(canvas.height/rect.height);var isVert3=canvas._volLayout==="vertical";var pos=isVert3?ty:tx;var v=Math.round((1-(isVert3?pos/canvas._volBarLen:pos/canvas._volBarLen))*100);v=Math.max(0,Math.min(100,v));canvas._volValue=v;_drawVolumeWidget(canvas,v,false,canvas._volLayout)}
function _onVolumeTouchEnd(e,canvas){if(canvas._volDragging){canvas._volDragging=false;fetch("/api/system/volume",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({value:canvas._volValue||50})}).catch(function(){})}}
function _fetchAndDrawVolume(canvas){canvas._volValue=canvas._volValue||50;var layout=canvas._volLayout||"horizontal";_drawVolumeWidget(canvas,canvas._volValue,false,layout);fetch("/api/system/volume").then(function(r){return r.json()}).then(function(d){canvas._volValue=d.output_volume;_drawVolumeWidget(canvas,d.output_volume,d.output_muted,layout)}).catch(function(){_drawVolumeWidget(canvas,canvas._volValue,false,layout)})}
function _drawMuteBtn(canvas,muted){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);var r=Math.min(w,h)*0.40;r=Math.max(20,Math.min(r,50));ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.fillStyle=muted?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.06)";ctx.fill();ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.strokeStyle=muted?"rgba(239,68,68,0.45)":"rgba(255,255,255,0.14)";ctx.lineWidth=1.2;ctx.stroke();var isz=r*1.15;_drawSpeakerIcon(ctx,w/2-isz/2,h/2-isz/2,isz,muted);canvas._muted=muted}
function _toggleMute(canvas){fetch("/api/system/mute",{method:"POST"}).then(function(r){return r.json()}).then(function(d){_drawMuteBtn(canvas,d.muted)})}

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
