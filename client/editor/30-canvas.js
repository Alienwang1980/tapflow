function rr(){
  if(!profile)return;
  const dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210,cs=profile.cellSize||60,gp=profile.gap||0;
  var ca=document.getElementById("carea"),cw=ca.clientWidth,ch=ca.clientHeight;
  document.getElementById("tgs").value=profile.defaultSound||"none";
  var _zv=document.getElementById("zv");if(_zv)_zv.textContent=cs;

  const scale=Math.min(cw*0.85/dw,ch*0.85/dh);
  const wrap=document.getElementById("cwrap");
  wrap.style.width=dw+"px";wrap.style.height=dh+"px";
  wrap.style.transform=`scale(${scale})`;

  const canvas=document.getElementById("canvas");
  canvas.style.width=dw+"px";canvas.style.height=dh+"px";const gridPx=cs+gp;if(!profile||profile.showGrid!==false){ca.style.backgroundImage="linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)";ca.style.backgroundSize=gridPx+"px "+gridPx+"px"}else{ca.style.backgroundImage="none"};

  // ftb at frame top-right corner
  const ox=(cw-dw*scale)/2,oy=(ch-dh*scale)/2;var _ov=document.getElementById("carea-overlay");if(_ov){var _wr=wrap.getBoundingClientRect();var _cr=ca.getBoundingClientRect();var _ox=_wr.left-_cr.left,_oy=_wr.top-_cr.top,_ow=_wr.width,_oh=_wr.height;_ov.style.clipPath="polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,"+_ox+"px "+_oy+"px,"+(_ox+_ow)+"px "+_oy+"px,"+(_ox+_ow)+"px "+(_oy+_oh)+"px,"+_ox+"px "+(_oy+_oh)+"px,"+_ox+"px "+_oy+"px)";}
const ftb=document.getElementById("ftb");var btb=document.getElementById("btb");if(btb){var wr=wrap.getBoundingClientRect();var cr=ca.getBoundingClientRect();btb.style.left="50%";btb.style.transform="translateX(-50%)";btb.style.top=(wr.bottom-cr.top+8)+"px";}ftb.style.right=ox+"px";ftb.style.top=Math.max(0,oy-36)+"px";ftb.style.left="auto";

  const cpx=cs+gp;
  ca.style.backgroundPosition=((dw/2+panX*cpx)%gridPx+gridPx)%gridPx+"px "+((dh/2+panY*cpx)%gridPx+gridPx)%gridPx+"px";
  canvas.innerHTML="";const grbox=document.createElement("div");grbox.className="grbox";grbox.id="grbox";canvas.appendChild(grbox);const grh_tl=document.createElement("div");grh_tl.className="grh";grh_tl.id="grh_tl";grh_tl.style.cursor="nw-resize";canvas.appendChild(grh_tl);const grh_tr=document.createElement("div");grh_tr.className="grh";grh_tr.id="grh_tr";grh_tr.style.cursor="ne-resize";canvas.appendChild(grh_tr);const grh_bl=document.createElement("div");grh_bl.className="grh";grh_bl.id="grh_bl";grh_bl.style.cursor="sw-resize";canvas.appendChild(grh_bl);const grh_br=document.createElement("div");grh_br.className="grh";grh_br.id="grh_br";grh_br.style.cursor="se-resize";canvas.appendChild(grh_br);
  const page=cp_();if(!page)return;ca.style.backgroundColor=page.bgColor||"#1a1a2e";var _pi=_patIMG(page.bgPattern);var _tl=document.getElementById("tl");if(_pi){ca.style.backgroundImage="";ca.style.backgroundSize="";_tl.style.display="block";_tl.style.backgroundColor=page.bgPatternColor||"#ffffff";_tl.style.webkitMaskImage='url("/uploads/'+_pi.img+'")';_tl.style.maskImage='url("/uploads/'+_pi.img+'")';var _sz3=(page.bgPatternSize||_pi.size)+"px";_tl.style.webkitMaskSize=_sz3+" "+_sz3;_tl.style.maskSize=_sz3+" "+_sz3}else{_tl.style.display="none";ca.style.cssText+=_patCSS(page.bgPattern,page.bgPatternColor||"#ffffff",page.bgPatternSize||60)}
  page.keys.forEach(k=>{
    const col=k.col||0,row=k.row||0,w=k.w||1,h=k.h||1;
    const x=(col+panX)*cpx+dw/2,y=(row+panY)*cpx+dh/2;
    const kw=Math.max(24,w*cs+(w-1)*gp-3),kh=Math.max(24,h*cs+(h-1)*gp-3);
    const sel=(k.id===selKey||selKeys.has(k.id))?" sel":"";
    const el=document.createElement("div");el.className="ck"+sel+(k.action==="touchpad"?" touchpad":k.action==="visualizer"?" visualizer":k.action==="balance"?" balance":"");el.dataset.kid=k.id;
    const brPct=(k.borderRadius!==undefined?k.borderRadius:10)/100;const br=(brPct*Math.min(kw,kh))+'px';const ff=k.fontFamily||'inherit';const fs=(k.fontSize||Math.max(8,cs*0.25))+'px';let bg=k.color||'var(--card)';let fc=k.fontColor||'inherit';if(k.bgType==='gradient'&&k.bgGradient){bg=_gradCSS(k.bgGradient,k.color||'#0f3460')}else if(k.bgType==='image'&&k.bgImage){bg='var(--card) url(/'+k.bgImage+') center/cover'};el.style.cssText=`left:${x}px;top:${y}px;width:${kw}px;height:${kh}px;background:${bg};color:${fc};border-radius:${br};font-family:${ff};font-size:${fs}`;
    if(k.action==='balance'){var _pv=document.createElement('canvas');_pv.width=kw-8;_pv.height=kh-8;_pv.style.borderRadius='3px';var _pctx=_pv.getContext('2d'),_pw=_pv.width,_ph=_pv.height;_pctx.fillStyle='rgba(0,0,0,0.3)';_pctx.fillRect(0,0,_pw,_ph);_pctx.fillStyle='#f59e0b';var _pfs=Math.max(8,Math.min(_ph*0.18,_pw*0.04));_pctx.font='bold '+_pfs+'px -apple-system,sans-serif';_pctx.textAlign='left';_pctx.textBaseline='top';_pctx.fillText('Deepseek',_pw*0.04,_ph*0.08);_pctx.fillStyle='#e8e0d8';var _pfs2=Math.max(10,Math.min(_ph*0.32,_pw*0.06));_pctx.font='bold '+_pfs2+'px -apple-system,sans-serif';_pctx.fillText(k.apiKey?'¥ ---.--':'Set API Key',_pw*0.04,_ph*0.35);_pctx.fillStyle='#8b8078';var _pfs3=Math.max(6,_ph*0.08);_pctx.font=_pfs3+'px -apple-system,sans-serif';_pctx.fillText('total balance',_pw*0.04,_ph*0.35+_pfs2+2);var _ply=_ph*0.7,_plh=Math.max(6,_ph*0.1);_pctx.font=Math.max(7,_ph*0.1)+'px -apple-system,sans-serif';_pctx.textBaseline='middle';_pctx.fillStyle='#f59e0b';_pctx.fillText('Topped up',_pw*0.04,_ply);_pctx.fillStyle='#e8e0d8';_pctx.textAlign='right';_pctx.fillText(k.apiKey?'---.--':'---.--',_pw*0.96,_ply);_ply+=_ph*0.15;_pctx.textAlign='left';_pctx.fillStyle='#8b8078';_pctx.fillText('Granted',_pw*0.04,_ply);_pctx.textAlign='right';_pctx.fillText(k.apiKey?'0.00':'0.00',_pw*0.96,_ply);el.appendChild(_pv);var _rh=document.createElement('div');_rh.className='rh';el.appendChild(_rh)}else if(k.action==="volume"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius="3px";
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;
    _c.fillStyle="rgba(0,0,0,0.3)";_c.fillRect(0,0,_w,_h);
    var _by=_h*0.4,_bh=_h*0.2,_mx=_w*0.1,_bw=_w-_mx*2;
    _c.fillStyle="rgba(255,255,255,0.1)";_c.fillRect(_mx,_by,_bw,_bh);
    _c.fillStyle="#4ade80";_c.fillRect(_mx,_by,_bw*0.7,_bh);
    _c.fillStyle="#fff";_c.beginPath();_c.arc(_mx+_bw*0.7,_by+_bh/2,_bh*0.7,0,Math.PI*2);_c.fill();
    _c.fillStyle="#fff";var _fs=Math.max(10,_h*0.25);_c.font="bold "+_fs+"px -apple-system,sans-serif";_c.textAlign="left";_c.fillText("VOL",_mx,_by-_fs/2);
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="mute"||k.action==="mic-mute"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius="3px";
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;
    _c.fillStyle="rgba(0,0,0,0.3)";_c.fillRect(0,0,_w,_h);
    _c.fillStyle="#888";_c.beginPath();_c.arc(_w/2,_h/2,Math.min(_w,_h)*0.35,0,Math.PI*2);_c.fill();
    _c.fillStyle="#fff";var _fs=Math.max(14,_h*0.4);_c.font=_fs+"px -apple-system,sans-serif";_c.textAlign="center";_c.textBaseline="middle";_c.fillText(k.action==="mute"?"M":"Mic",_w/2,_h/2);
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="win-shortcuts"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius="3px";
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height,_bw=_w/2,_bh=_h/2;
    _c.fillStyle="rgba(0,0,0,0.3)";_c.fillRect(0,0,_w,_h);
    for(var _r=0;_r<2;_r++)for(var _cc=0;_cc<2;_cc++){_c.fillStyle="rgba(255,255,255,0.1)";_c.fillRect(_cc*_bw+2,_r*_bh+2,_bw-4,_bh-4)}
    var _fs=Math.max(8,_h*0.18);_c.font=_fs+"px -apple-system,sans-serif";_c.textAlign="center";_c.textBaseline="middle";
    _c.fillStyle="#ccc";_c.fillText("Full",_bw/2,_bh/2);_c.fillText("Min",_bw*1.5,_bh/2);_c.fillText("MC",_bw/2,_bh*1.5);_c.fillText("Desk",_bw*1.5,_bh*1.5);
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="dock"){
    // Frosted glass via CSS on container
    var _dc2=k.bgColor||k.color||null;
    var _bgo2=k.bgOpacity!==undefined?k.bgOpacity:0.15;
    if(_bgo2>0.001&&_dc2){
      var _hex2=_dc2.replace("#","");
      var _r2=parseInt(_hex2.substring(0,2),16),_g2=parseInt(_hex2.substring(2,4),16),_b2=parseInt(_hex2.substring(4,6),16);
      el.style.background="rgba("+_r2+","+_g2+","+_b2+","+_bgo2+")";
      el.style.backdropFilter="blur(8px)";el.style.webkitBackdropFilter="blur(8px)";
    }else{el.style.background="transparent";el.style.backdropFilter="none";el.style.webkitBackdropFilter="none"}
    var _cv=document.createElement("canvas");_cv.width=kw;_cv.height=kh;
    el.appendChild(_cv);
    _drawEditorDock(_cv, k);
    var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="app-menu"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius="3px";
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;
    _c.fillStyle="rgba(0,0,0,0.3)";_c.fillRect(0,0,_w,_h);
    var _fs=Math.max(7,_h*0.12);_c.font=_fs+"px -apple-system,sans-serif";_c.textAlign="left";
    _c.fillStyle="#f59e0b";_c.fillText("File",8,_fs+2);
    _c.fillStyle="#ccc";_c.fillText("New Window",14,_fs*2.5+2);_c.fillText("Open...",14,_fs*3.5+2);
    _c.fillStyle="#888";_c.textAlign="right";_c.fillText("cmd+n",_w-4,_fs*2.5+2);_c.fillText("cmd+o",_w-4,_fs*3.5+2);
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="layout-preset"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius="3px";
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;
    _c.fillStyle="rgba(0,0,0,0.3)";_c.fillRect(0,0,_w,_h);
    var _rhh=Math.max(14,_h/4);
    for(var _i=0;_i<Math.min(3,Math.floor(_h/_rhh));_i++){var _y=_i*_rhh+4;_c.fillStyle="rgba(255,255,255,0.05)";_c.fillRect(2,_y,_w-4,_rhh-2);
      _c.fillStyle="#ccc";var _fs=Math.max(7,_rhh*0.4);_c.font=_fs+"px -apple-system,sans-serif";_c.textAlign="left";_c.fillText("Preset "+(_i+1),8,_y+_rhh/2+_fs*0.3);
      _c.fillStyle="#4ade80";_c.textAlign="right";_c.fillText("Apply",_w-8,_y+_rhh/2+_fs*0.3)}
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="active-app"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius="3px";
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;
    _c.fillStyle="rgba(0,0,0,0.3)";_c.fillRect(0,0,_w,_h);
    _c.fillStyle="#888";var _fs=Math.max(9,_h*0.3);_c.font=_fs+"px -apple-system,sans-serif";_c.textAlign="right";_c.textBaseline="middle";_c.fillText("Mac:",_w*0.4,_h/2);
    _c.fillStyle="#fff";_c.textAlign="left";_c.fillText("App",_w*0.45,_h/2);
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else{el.innerHTML='<span class="kl">'+hesc(k.label)+'</span>'+(w>1||h>1?'<span class="sz">'+w.toFixed(2)+'×'+h.toFixed(2)+'</span>':'')+((selKeys.size<=1?'<div class="rh"></div>':''))}    el.addEventListener("mousedown",e=>onKeyDown(e,k.id));
    el.addEventListener("click",e=>onKeyClick(e,k.id));
    const rh=el.querySelector(".rh");if(rh)rh.addEventListener("mousedown",e=>onRS(e,k.id));
    canvas.appendChild(el);
  });
  
  // Group bounding box + corner handles (all in canvas coords)
  if(selKeys.size>1&&page.keys.length>0){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    page.keys.forEach(k=>{if(selKeys.has(k.id)){
      const col=k.col||0,row=k.row||0,w=k.w||1,h=k.h||1;
      const kx=(col+panX)*cpx+dw/2,ky=(row+panY)*cpx+dh/2;
      const kw2=w*cs+(w-1)*gp-3,kh2=h*cs+(h-1)*gp-3;
      if(kx<minX)minX=kx;if(ky<minY)minY=ky;
      if(kx+kw2>maxX)maxX=kx+kw2;if(ky+kh2>maxY)maxY=ky+kh2;
    }});
    const gx=minX,gy=minY,gw=maxX-minX,gh=maxY-minY;
    const gbox=document.getElementById("grbox");if(gbox){gbox.style.display="block";gbox.style.left=gx+"px";gbox.style.top=gy+"px";gbox.style.width=gw+"px";gbox.style.height=gh+"px";}
    const gtl=document.getElementById("grh_tl");if(gtl){gtl.style.display="block";gtl.style.left=(gx-5)+"px";gtl.style.top=(gy-5)+"px";}
    const gtr=document.getElementById("grh_tr");if(gtr){gtr.style.display="block";gtr.style.left=(gx+gw-5)+"px";gtr.style.top=(gy-5)+"px";}
    const gbl=document.getElementById("grh_bl");if(gbl){gbl.style.display="block";gbl.style.left=(gx-5)+"px";gbl.style.top=(gy+gh-5)+"px";}
    const gbr=document.getElementById("grh_br");if(gbr){gbr.style.display="block";gbr.style.left=(gx+gw-5)+"px";gbr.style.top=(gy+gh-5)+"px";}
  }else{const gb=document.getElementById("grbox");if(gb)gb.style.display="none";["grh_tl","grh_tr","grh_bl","grh_br"].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display="none"});}

  
  // Attach group resize handlers
  ["grh_tl","grh_tr","grh_bl","grh_br"].forEach(function(id){
    var h=document.getElementById(id);if(h)h.onmousedown=function(e){grResizeStart(e,id)};
  });

// Group resize functions
function grResizeStart(e,corner){
  e.preventDefault();e.stopPropagation();
  var page=cp_();if(!page)return;
  var cs2=profile.cellSize||60,gp2=profile.gap||0,cpx2=cs2+gp2;
  var ca2=document.getElementById("carea"),cw2=ca2.clientWidth,ch2=ca2.clientHeight;
  var dw2=profile.deviceWidth||834,dh2=profile.deviceHeight||1210;
  var scale2=Math.min(cw2*0.85/dw2,ch2*0.85/dh2);
  var startX=e.clientX,startY=e.clientY;
  var orig=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){var s=_snapshot(k);s.col=s.col||0;s.row=s.row||0;s.w=s.w||1;s.h=s.h||1;return s});
  var oMinX=Infinity,oMinY=Infinity,oMaxX=-Infinity,oMaxY=-Infinity;
  orig.forEach(function(k){
    if(k.col<oMinX)oMinX=k.col;if(k.row<oMinY)oMinY=k.row;
    if(k.col+k.w>oMaxX)oMaxX=k.col+k.w;if(k.row+k.h>oMaxY)oMaxY=k.row+k.h;
  });
  var oW=oMaxX-oMinX,oH=oMaxY-oMinY;
  function mm(ev){
    var dx=(ev.clientX-startX)/(cpx2*scale2),dy=(ev.clientY-startY)/(cpx2*scale2);
    var sX=1,sY=1,aX=0,aY=0;
    if(corner==="grh_tl"){aX=oMaxX;aY=oMaxY;sX=Math.max(0.1,(oW-dx)/oW);sY=Math.max(0.1,(oH-dy)/oH)}
    else if(corner==="grh_tr"){aX=oMinX;aY=oMaxY;sX=Math.max(0.1,(oW+dx)/oW);sY=Math.max(0.1,(oH-dy)/oH)}
    else if(corner==="grh_bl"){aX=oMaxX;aY=oMinY;sX=Math.max(0.1,(oW-dx)/oW);sY=Math.max(0.1,(oH+dy)/oH)}
    else{aX=oMinX;aY=oMinY;sX=Math.max(0.1,(oW+dx)/oW);sY=Math.max(0.1,(oH+dy)/oH)}
    page.keys.forEach(function(k){
      if(!selKeys.has(k.id))return;
      var o=orig.find(function(x){return x.id===k.id});if(!o)return;
      if(corner==="grh_tl"){k.col=_snap4(aX-(aX-o.col)*sX);k.row=_snap4(aY-(aY-o.row)*sY)}
      else if(corner==="grh_tr"){k.col=_snap4(aX+(o.col-aX)*sX);k.row=_snap4(aY-(aY-o.row)*sY)}
      else if(corner==="grh_bl"){k.col=_snap4(aX-(aX-o.col)*sX);k.row=_snap4(aY+(o.row-aY)*sY)}
      else{k.col=_snap4(aX+(o.col-aX)*sX);k.row=_snap4(aY+(o.row-aY)*sY)}
      k.w=_snap4(Math.max(0.25,o.w*sX));k.h=_snap4(Math.max(0.25,o.h*sY));
    });
    dirty=true;rr();
  }
  function mu(){
    document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);
    var now=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});
    if(JSON.stringify(orig)!==JSON.stringify(now))_pushUndo(orig);
  }
  document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);
}

  document.getElementById("edinfo").textContent=`sel=${selKeys.size} cw=${cw}x${ch} dw=${dw}x${dh} cs=${cs} gap=${gp} s=${scale.toFixed(3)} pan=(${panX.toFixed(1)},${panY.toFixed(1)})`;
  // Elevate selected keys to top
  canvas.querySelectorAll(".ck").forEach(function(el) {
    el.style.zIndex = (selKey && el.dataset.kid === selKey) || selKeys.has(el.dataset.kid) ? "999" : "";
  });
}

// Key click: select or Shift-toggle
function onKeyClick(e,kid){
  e.stopPropagation();
  if(!e.shiftKey){selKeys.clear();selKeys.add(kid)}
  selKey=kid;rr();rpr();
}

// Key drag: multi-select aware, 0.25 snap, collision
function onKeyDown(e,kid){
  if(e.button!==0)return;e.stopPropagation();
  if(e.shiftKey&&selKeys.has(kid)){selKeys.delete(kid);selKey=null}else if(!selKeys.has(kid)){if(!e.shiftKey){selKeys.clear()}selKeys.add(kid);selKey=kid}
rr();rpr();
  const k=cp_()?.keys.find(x=>x.id===kid);if(!k)return;
  const cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;
  const ca=document.getElementById("carea"),cw=ca.clientWidth,ch=ca.clientHeight;
  const dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210;
  const scale=Math.min(cw*0.85/dw,ch*0.85/dh);
  const startX=e.clientX,startY=e.clientY;
  const moved=[];selKeys.forEach(id=>{const kk=cp_()?.keys.find(x=>x.id===id);if(kk)moved.push({id,scol:kk.col||0,srow:kk.row||0})});
  const before=cp_()?.keys.filter(kk=>selKeys.has(kk.id)).map(kk=>_snapshot(kk))||[];
  function mm(ev){
    const dx=(ev.clientX-startX)/(cpx*scale),dy=(ev.clientY-startY)/(cpx*scale);
    let anyMoved=false;
    const newPos=moved.map(m=>{const nc=_snap4(m.scol+dx),nr=_snap4(m.srow+dy);return{...m,nc,nr}});
    var _tryMove=function(np){return np.every(function(m){return !cp_()?.keys.some(function(ok){return ok.id!==m.id&&!selKeys.has(ok.id)&&_overlap({col:m.nc,row:m.nr,w:cp_()?.keys.find(function(x){return x.id===m.id})?.w||1,h:cp_()?.keys.find(function(x){return x.id===m.id})?.h||1},{col:ok.col||0,row:ok.row||0,w:ok.w||1,h:ok.h||1})})})};var finalPos=newPos;var ok=_tryMove(newPos);if(!ok){var xOnly=newPos.map(function(m){return{id:m.id,scol:m.scol,srow:m.srow,nc:m.nc,nr:m.srow}});if(_tryMove(xOnly)){finalPos=xOnly;ok=true}else{var yOnly=newPos.map(function(m){return{id:m.id,scol:m.scol,srow:m.srow,nc:m.scol,nr:m.nr}});if(_tryMove(yOnly)){finalPos=yOnly;ok=true}}};
    if(ok){finalPos.forEach(m=>{const kk=cp_()?.keys.find(x=>x.id===m.id);if(kk&&(kk.col!==m.nc||kk.row!==m.nr)){kk.col=m.nc;kk.row=m.nr;anyMoved=true}});if(anyMoved){dirty=true;rr();selKey=kid}}
  }
  function mu(ev){
    document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);
    const now=cp_()?.keys.filter(kk=>selKeys.has(kk.id)).map(kk=>_snapshot(kk))||[];
    if(!undoStack.length||JSON.stringify(undoStack[undoStack.length-1].before)!==JSON.stringify(now)){if(JSON.stringify(before)!==JSON.stringify(now)){_pushUndo(before)}}
    if(selKeys.size===1){
      const el=document.elementFromPoint(ev.clientX,ev.clientY),tk=el?.closest?.(".ck");
      if(tk&&tk.dataset.kid!==kid){
        const a=cp_()?.keys.find(x=>x.id===kid),b=cp_()?.keys.find(x=>x.id===tk.dataset.kid);
        if(a&&b){const sb=[_snapshot(a),_snapshot(b)];const ac=a.col,ar=a.row,aw=a.w,ah=a.h;a.col=b.col;a.row=b.row;a.w=b.w;a.h=b.h;b.col=ac;b.row=ar;b.w=aw;b.h=ah;_pushUndo(sb);dirty=true;rr();selKey=kid}
      }
    }
  }
  document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);
}

// Key resize: 0.25 snap, collision, Shift=left resize
function onRS(e,kid){
  e.preventDefault();e.stopPropagation();selKey=kid;selKeys.clear();selKeys.add(kid);rr();rpr();
  const k=cp_()?.keys.find(x=>x.id===kid);if(!k)return;
  const cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;
  const ca=document.getElementById("carea"),cw=ca.clientWidth,ch=ca.clientHeight;
  const dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210;
  const scale=Math.min(cw*0.85/dw,ch*0.85/dh);
  const startX=e.clientX,startY=e.clientY,startW=k.w||1,startH=k.h||1,startCol=k.col||0;
  const before=_snapshot(k);
  function mm(ev){
    const dw_=_snap4((ev.clientX-startX)/(cpx*scale)),dh_=_snap4((ev.clientY-startY)/(cpx*scale));
    const nw=Math.max(0.25,_snap4(startW+dw_)),nh=Math.max(0.25,_snap4(startH+dh_));
    const ncol=ev.shiftKey?_snap4(startCol-dw_):startCol;
    if(!_collides(kid,ncol,k.row||0,nw,nh)&&(nw!==k.w||nh!==k.h||ncol!==k.col)){k.col=ncol;k.w=nw;k.h=nh;dirty=true;rr();selKey=kid}
  }
  function mu(){document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);if(JSON.stringify(before)!==JSON.stringify(_snapshot(k))){_pushUndo([before])}}
  document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);
}

// Dblclick to add key (0.25 snap)


// ── Carea: left=select rect, right=pan ──
var _libItems=document.querySelectorAll(".lib-item");for(var _li=0;_li<_libItems.length;_li++){_libItems[_li].addEventListener("dragstart",function(e){e.dataTransfer.setData("text/plain",this.dataset.widget);e.dataTransfer.effectAllowed="copy"})}document.addEventListener("dragover",function(e){e.preventDefault();e.dataTransfer.dropEffect="copy";var _ca=document.getElementById("carea"),_rect=_ca.getBoundingClientRect();if(e.clientX>=_rect.left&&e.clientX<=_rect.right&&e.clientY>=_rect.top&&e.clientY<=_rect.bottom){var _gh=document.getElementById("gh");_gh.style.display="block";_gh.style.left=(e.clientX-_rect.left-10)+"px";_gh.style.top=(e.clientY-_rect.top-10)+"px";_gh.style.width="20px";_gh.style.height="20px"}});document.addEventListener("drop",function(e){e.preventDefault();document.getElementById("gh").style.display="none";document.body.style.cursor="";var type=e.dataTransfer.getData("text/plain");if(!type||!profile)return;var _ca2=document.getElementById("carea"),_rect2=_ca2.getBoundingClientRect();var dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210,cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;var scale=Math.min(_ca2.clientWidth*0.85/dw,_ca2.clientHeight*0.85/dh);var ox2=(_ca2.clientWidth-dw*scale)/2,oy2=(_ca2.clientHeight-dh*scale)/2;var dx=(e.clientX-_rect2.left-ox2)/scale,dy=(e.clientY-_rect2.top-oy2)/scale;window._pendingCol=_snap4((dx-dw/2)/cpx-panX);window._pendingRow=_snap4((dy-dh/2)/cpx-panY);var tw=type==="touchpad"?4:1,th=type==="touchpad"?3:1;if(!_collides(null,window._pendingCol,window._pendingRow,tw,th)){if(type==="__clipboard__"){_pasteFromClipboard(window._pendingCol,window._pendingRow)}else{addKeyOfType(type)}}});
const carea=document.getElementById("carea");
carea.addEventListener("mousedown",e=>{
  if(e.button===0&&!e.target.closest(".ck")&&!e.target.closest(".grh")){
    selecting=true;
    srSX=e.clientX;srSY=e.clientY;srCX=e.clientX;srCY=e.clientY;
    if(!e.shiftKey){selKeys.clear();selKey=null;rr();rpr()}
    e.preventDefault();
  }else if(e.button===2){
    panning=true;panStartX=e.clientX;panStartY=e.clientY;mx=panX;my=panY;e.preventDefault();
  }
});
carea.addEventListener("contextmenu",e=>{e.preventDefault()});

// ── Document mousemove: selection rect or pan ──
document.addEventListener("mousemove",e=>{
  if(selecting){
    srCX=e.clientX;srCY=e.clientY;
    const sr=document.getElementById("sr"),ca=document.getElementById("carea"),rect=ca.getBoundingClientRect();
    const x1=Math.min(srSX,srCX),y1=Math.min(srSY,srCY),x2=Math.max(srSX,srCX),y2=Math.max(srSY,srCY);
    sr.style.display="block";sr.style.left=(x1-rect.left)+"px";sr.style.top=(y1-rect.top)+"px";
    sr.style.width=(x2-x1)+"px";sr.style.height=(y2-y1)+"px";
    // Highlight keys in rect
    const c1=_scr2cell(x1,y1),c2=_scr2cell(x2,y2);
    const mc=Math.min(c1.col,c2.col),Mc=Math.max(c1.col,c2.col),mr=Math.min(c1.row,c2.row),Mr=Math.max(c1.row,c2.row);
    selKeys.clear();
    cp_()?.keys.forEach(k=>{const col=k.col||0,row=k.row||0,w=k.w||1,h=k.h||1;if(col+w>mc&&col<Mc&&row+h>mr&&row<Mr)selKeys.add(k.id)});
    rr();return;
  }
  if(!panning)return;
  const ca=document.getElementById("carea"),cw=ca.clientWidth,ch=ca.clientHeight;
  const dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210,cs=profile.cellSize||60,gp=profile.gap||0;
  const cpx=cs+gp;
  const scale=Math.min(cw*0.85/dw,ch*0.85/dh);
  panX=mx+(e.clientX-panStartX)/(cpx*scale);
  panY=my+(e.clientY-panStartY)/(cpx*scale);
  rr();
});

// ── Document mouseup: finalize selection / pan snap ──
document.addEventListener("mouseup",e=>{
  if(selecting){
    selecting=false;
    document.getElementById("sr").style.display="none";
    if(selKeys.size===1)selKey=[...selKeys][0];else selKey=null;
    rr();rpr();
  }
  if(panning){
    panning=false;
    panX=_snap4(panX);panY=_snap4(panY);
    rr();
  }
});

// ── Zoom ──
carea.addEventListener("wheel",e=>{e.preventDefault();zoomBy(e.deltaY>0?-1:1)},{passive:false});
function fitAll(){if(!profile)return;var page=profile.pages.find(function(p){return p.id===activePage});if(!page||!page.keys.length)return;var cs=profile.cellSize||60,gp=profile.gap||0,dw=profile.deviceWidth||834,dh=profile.deviceHeight||1210;var cpx=cs+gp;var minC=Infinity,minR=Infinity,maxC=-Infinity,maxR=-Infinity;page.keys.forEach(function(k){var c=k.col||0,r=k.row||0,w=k.w||1,h=k.h||1;if(c<minC)minC=c;if(r<minR)minR=r;if(c+w>maxC)maxC=c+w;if(r+h>maxR)maxR=r+h});if(minC===Infinity)return;var cols=maxC-minC,rows=maxR-minR;var kw=cols*cpx-gp,kh=rows*cpx-gp;var pad=0;var scale=Math.min((dw-pad*2)/kw,(dh-pad*2)/kh,2.5);var newCs=Math.max(15,Math.floor(cs*scale));var centerC=(minC+maxC)/2,centerR=(minR+maxR)/2;profile.cellSize=newCs;profile.canvasX=-centerC;profile.canvasY=-centerR;panX=-centerC;panY=-centerR;rr();dirty=true}
function zoomBy(d){const nv=Math.max(20,Math.min(200,(profile.cellSize||60)+d));if(nv!==profile.cellSize){profile.cellSize=nv;dirty=true;rr()}}
function toggleOri(){const t=profile.deviceWidth;profile.deviceWidth=profile.deviceHeight;profile.deviceHeight=t;dirty=true;rr()}
function onFDev(){const d=DEVS[document.getElementById("fdev").value];if(d&&profile){profile.device=document.getElementById("fdev").value;profile.deviceWidth=d.w;profile.deviceHeight=d.h;dirty=true;rr()}}


function onDev(){} // removed — use onFDev from frame toolbar
// ── Editor dock preview (caches dock data, re-renders instantly) ──
var _editorDockCache = {};
var _editorDockApps = null;
function _drawEditorDock(canvas, key) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  function _render(apps) {
    ctx.clearRect(0, 0, w, h);
    if (!apps || !apps.length) { ctx.fillText("No dock items", w/2, h/2); return; }
    var iconSize = Math.max(16, Math.min(40, h * 0.55));
    var gap = 4, itemW = iconSize + gap * 2;
    var maxScroll = Math.max(0, apps.length * itemW - w);
    if (maxScroll > 0) { var s = w / (apps.length * itemW); iconSize *= s; gap *= s; itemW *= s; }
    var fs = Math.max(6, iconSize * 0.18);
    ctx.font = fs + "px -apple-system,sans-serif";
    ctx.textAlign = "center";
    for (var i = 0; i < apps.length; i++) {
      var x = i * itemW + gap;
      if (x + iconSize > w) break;
      var a = apps[i];
      var iconY = (h - iconSize - fs - 4) / 2;
      if (a.running) {
        ctx.fillStyle = "#4ade80";
        ctx.beginPath(); ctx.arc(x + iconSize/2, iconY - 2, 3, 0, Math.PI*2); ctx.fill();
      }
      var cacheKey = a.bundle || a.name;
      if (!_editorDockCache[cacheKey]) {
        var img = new Image();
        img.src = "/api/system/app-icon?name=" + encodeURIComponent(cacheKey);
        _editorDockCache[cacheKey] = img;
      }
      var ci = _editorDockCache[cacheKey];
      if (ci && ci.complete && ci.naturalWidth > 0) {
        ctx.drawImage(ci, x, iconY, iconSize, iconSize);
      } else {
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(x, iconY, iconSize, iconSize);
        var initFs = Math.max(10, iconSize * 0.45);
        ctx.font = "bold " + initFs + "px -apple-system,sans-serif";
        ctx.fillStyle = "#888"; ctx.textBaseline = "middle";
        ctx.fillText(a.name.charAt(0).toUpperCase(), x + iconSize/2, iconY + iconSize/2);
      }
      ctx.fillStyle = "#aaa"; ctx.font = fs + "px -apple-system,sans-serif";
      ctx.textBaseline = "top";
      var label = a.name.length > 8 ? a.name.substring(0,7)+".." : a.name;
      ctx.fillText(label, x + iconSize/2, iconY + iconSize + 1);
    }
  }
  // Use cached data if available, otherwise fetch
  if (_editorDockApps) {
    _render(_editorDockApps);
    return;
  }
  ctx.fillStyle = "#888";
  ctx.font = Math.max(8, h*0.3) + "px -apple-system,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Loading...", w/2, h/2);
  fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(apps){
    _editorDockApps = apps;
    _render(apps);
    // Poll for running status updates
    if (!canvas._edDockPoll) {
      canvas._edDockPoll = setInterval(function(){
        fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
          _editorDockApps = d; _render(d);
        }).catch(function(){});
      }, 3000);
    }
  }).catch(function(){ ctx.clearRect(0,0,w,h); ctx.fillText("Dock unavailable", w/2, h/2); });
}
