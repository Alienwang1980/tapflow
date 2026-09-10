function renderAll(){rpl();if(profile){rpgl()}rr();if(profile){rpr();rgrp()}}
function rpl(){var _pl=document.getElementById("pl");if(_pl)_pl.innerHTML=profiles.map(p=>'<div class="it'+(p.filename===activeProfile?" ac":"")+'" onclick="lp(\''+p.filename+'\')">'+hesc(p.profileName)+'<span class="x" onclick="event.stopPropagation();dp(\''+p.filename+'\')" style="margin-left:6px;border-left:1px solid var(--border);padding-left:6px" title="Delete">×</span></div>').join("");var tpf=document.getElementById("tpf");if(tpf){tpf.innerHTML=profiles.map(function(p){return"<option value='"+p.filename+"'>"+p.profileName+"</option>"}).join("")+"<option value='__manage__' style='color:var(--accent)'>Manage...</option></option>";if(activeProfile)tpf.value=activeProfile}renderProfileList()}
function renderProfileList(){var el=document.getElementById("profList");if(!el)return;if(!profiles||!profiles.length){el.innerHTML='<p style="font-size:10px;color:var(--dim);padding:4px 2px">No profiles</p><button onclick="pmCreate()" style="margin-top:6px;padding:6px 12px;font-size:11px;background:var(--accent);color:#1a1a1a;border:none;border-radius:4px;cursor:pointer;font-weight:600;width:100%">+ Create New Profile</button>';return}el.innerHTML=profiles.map(function(p){return '<div class="it'+(p.filename===activeProfile?" ac":"")+'" onclick="lp(\''+p.filename+'\')"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+hesc(p.profileName)+'</span><span title="Duplicate" onclick="event.stopPropagation();pmDuplicate(\''+p.filename+'\')" style="opacity:0.6;color:var(--dim);cursor:pointer;font-size:12px;padding:2px 6px;border-radius:3px">&#x29C9;</span><span title="Rename" onclick="event.stopPropagation();pmRenamePrompt(\''+p.filename+'\')" style="opacity:0.6;color:var(--dim);cursor:pointer;font-size:12px;padding:2px 6px;border-radius:3px">&#x270E;</span><span class="x" title="Delete" onclick="event.stopPropagation();dp(\''+p.filename+'\')" style="margin-left:6px;border-left:1px solid var(--border);padding-left:6px">&times;</span></div>'}).join("")}
function pmRenamePrompt(fn){var p=(profiles||[]).find(function(x){return x.filename===fn});var cur=p?p.profileName:"";var nm=prompt("Rename profile:",cur);if(nm&&nm.trim()&&nm.trim()!==cur)pmRename(fn,nm.trim())}
function pmDuplicate(fn){fetch("/api/profiles/"+encodeURIComponent(fn)).then(function(r){return r.json()}).then(function(d){if(!d||!d.pages){t("Duplicate failed");return}d.profileName=(d.profileName||"profile")+" copy";return fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)})}).then(function(r){return r.json()}).then(function(d){if(d&&d.filename){lpl();t("Duplicated: "+d.filename)}})}
function rpgl(){var h=document.getElementById("pp-heading");if(h)h.textContent="Page Style";var _cp=cp_();var _bg=document.getElementById("pageBg");if(_bg&&_cp)_bg.value=_cp.bgColor||"#1a1a2e";var _pt=document.getElementById("pagePat");if(_pt&&_cp)_pt.value=_cp.bgPattern||"none";var _pc=document.getElementById("pagePatColor");if(_pc&&_pc)_pc.value=_cp.bgPatternColor||"#ffffff";var _ps=document.getElementById("pagePatSz");if(_ps&&_ps)_ps.value=_cp.bgPatternSize||60;_patPrev()}

function upkShowFlag(flag,val){var k=cp_()?.keys.find(function(x){return x.id===selKey});if(!k)return;if(!k.showFlags)k.showFlags={};k.showFlags[flag]=val;_setDirty();rr()}
function upkPageBg(v){var p=cp_();if(!p)return;p.bgColor=v;_setDirty();rr()}
function upkPagePattern(v){var p=cp_();if(!p)return;p.bgPattern=v==="none"?null:v;_setDirty();rr();_patPrev()}
function upkPagePatternColor(v){var p=cp_();if(!p)return;p.bgPatternColor=v;_setDirty();rr();_patPrev()}
function upkPagePatternSize(v){var p=cp_();if(!p)return;var max=2000;if(_patIMG(p.bgPattern)){max=5000}var ns=Math.max(10,Math.min(max,parseInt(v)||60));p.bgPatternSize=ns;var _ps=document.getElementById("pagePatSz");if(_ps)_ps.value=ns;_setDirty();rr();_patPrev()}
// 图案缩略图预览(Page Style 区): 按当前图案/颜色/尺寸真实平铺渲染
function _patPrev(){var p=cp_();var el=document.getElementById("patPreview");if(!el)return;var pid=p?p.bgPattern:null;if(!pid||pid==="none"){el.style.backgroundImage="none";el.style.backgroundSize="";el.style.backgroundColor="";el.innerHTML='<span style="font-size:10px;color:var(--dim)">No Pattern</span>';return}var pat=PATTERNS[pid];if(!pat)return;var sz=p.bgPatternSize||pat.size||60;var col=p.bgPatternColor||"#ffffff";el.innerHTML='<span class="pp-name"></span>';var nm=el.querySelector(".pp-name");if(nm)nm.textContent=pat.label+" · "+sz+"px";if(pat.img){el.style.backgroundImage='url("/uploads/'+pat.img+'")';el.style.backgroundSize=sz+"px "+sz+"px";el.style.backgroundColor="#ffffff"}else{var m=_patCSS(pid,col,sz).match(/url\("([^"]+)"\)/);el.style.backgroundImage=m?'url("'+m[1]+'")':"none";el.style.backgroundSize=sz+"px "+sz+"px";el.style.backgroundColor=""}}
function _overlap(a,b){return !(a.col+a.w<=b.col||b.col+b.w<=a.col||a.row+a.h<=b.row||b.row+b.h<=a.row)}
function _collides(kid,col,row,w,h){
  const page=cp_();if(!page)return false;
  return page.keys.some(k=>k.id!==kid&&_overlap({col,row,w,h},{col:k.col||0,row:k.row||0,w:k.w||1,h:k.h||1}));
}
function _snap4(v){return Math.round(v*4)/4}

// Screen → cell coordinates (for selection rect)
function _gradCSS(preset,color){const c=color||'#0f3460';const m={'top-down':'linear-gradient(180deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','left-right':'linear-gradient(90deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','diagonal-tl':'linear-gradient(135deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','diagonal-tr':'linear-gradient(225deg,'+c+' 0%,rgba(0,0,0,0.6) 100%)','radial':'radial-gradient(circle,'+c+' 0%,rgba(0,0,0,0.6) 100%)'};return m[preset]||c}

function _fitScale(){var ca=document.getElementById("carea");return Math.min(ca.clientWidth*0.85/(profile.deviceWidth||1210),ca.clientHeight*0.85/(profile.deviceHeight||834))}
function _totalScale(){return _fitScale()*viewZoom}
function _viewOrigin(){var ca=document.getElementById("carea"),ts=_totalScale(),dw=profile.deviceWidth||1210,dh=profile.deviceHeight||834;return{ox:(ca.clientWidth-dw*ts)/2+viewX,oy:(ca.clientHeight-dh*ts)/2+viewY}}

function _scr2cell(sx,sy){
  const ca=document.getElementById("carea"),rect=ca.getBoundingClientRect(),cw=ca.clientWidth,ch=ca.clientHeight;
  const dw=profile.deviceWidth||1210,dh=profile.deviceHeight||834,cs=profile.cellSize||60,gp=profile.gap||0;
  const cpx=cs+gp;
  const ts=_totalScale();
  const vo=_viewOrigin();
  const dx=(sx-rect.left-vo.ox)/ts,dy=(sy-rect.top-vo.oy)/ts;
  return {col:(dx-dw/2)/cpx-panX,row:(dy-dh/2)/cpx-panY};
}
function rr(){
  if(!profile){var ca=document.getElementById("carea");if(ca){ca.style.backgroundImage="none";ca.style.backgroundColor="#1a1a2e"}var cv=document.getElementById("canvas");if(cv){cv.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;color:var(--dim);font-size:16px;gap:14px"><span>&#x1F4C4; Create new profile</span><div style="display:flex;gap:10px"><button onclick="pmCreate()" style="padding:10px 24px;font-size:14px;background:var(--accent);color:#1a1a1a;border:none;border-radius:6px;cursor:pointer;font-weight:600">Create New</button><button onclick="pmImport()" style="padding:10px 24px;font-size:14px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:6px;cursor:pointer">Import Profile</button></div></div>'}var wr=document.getElementById("cwrap");if(wr){wr.style.width="1210px";wr.style.height="834px";wr.style.transform="scale(0.5)"}return}
  updateRatioInfo();
  const dw=profile.deviceWidth||1210,dh=profile.deviceHeight||834,cs=profile.cellSize||60,gp=profile.gap||0;
  var ca=document.getElementById("carea"),cw=ca.clientWidth,ch=ca.clientHeight;
  var _zv=document.getElementById("zv");if(_zv)_zv.textContent=cs;

  const fitScale=_fitScale(),scale=fitScale*viewZoom;
  const wrap=document.getElementById("cwrap");
  wrap.style.width=dw+"px";wrap.style.height=dh+"px";
  wrap.style.transform=`translate(${viewX}px,${viewY}px) scale(${scale})`;

  const canvas=document.getElementById("canvas");
  canvas.style.width=dw+"px";canvas.style.height=dh+"px";const gridPx=cs+gp;if(!profile||profile.showGrid!==false){ca.style.backgroundImage="linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)";ca.style.backgroundSize=gridPx+"px "+gridPx+"px"}else{ca.style.backgroundImage="none"};

  // ftb at frame top-right corner
  const ox=(cw-dw*scale)/2+viewX,oy=(ch-dh*scale)/2+viewY;var _ov=document.getElementById("carea-overlay");if(_ov){var _wr=wrap.getBoundingClientRect();var _cr=ca.getBoundingClientRect();var _ox=_wr.left-_cr.left,_oy=_wr.top-_cr.top,_ow=_wr.width,_oh=_wr.height;_ov.style.clipPath="polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,"+_ox+"px "+_oy+"px,"+(_ox+_ow)+"px "+_oy+"px,"+(_ox+_ow)+"px "+(_oy+_oh)+"px,"+_ox+"px "+(_oy+_oh)+"px,"+_ox+"px "+_oy+"px)";}
const ftb=document.getElementById("ftb");var btb=document.getElementById("btb");if(btb){btb.style.left="50%";btb.style.right="auto";btb.style.top="60px";btb.style.transform="translateX(-50%)";}if(ftb){ftb.style.right=((cw-dw*scale)/2-viewX)+"px";ftb.style.top=Math.max(0,(ch-dh*scale)/2+viewY-36)+"px";ftb.style.left="auto";}

  const cpx=cs+gp;
  ca.style.backgroundPosition=((dw/2+panX*cpx+viewX)%gridPx+gridPx)%gridPx+"px "+((dh/2+panY*cpx+viewY)%gridPx+gridPx)%gridPx+"px";
  canvas.innerHTML="";var _ti=profile.topInset||0;if(_ti>0){var _tb=document.createElement("div");_tb.id="tiBand";_tb.style.cssText="position:absolute;top:0;left:0;right:0;height:"+_ti+"px;z-index:9;pointer-events:none;background:repeating-linear-gradient(45deg,rgba(217,119,6,0.32) 0 10px,rgba(217,119,6,0.10) 10px 20px);border-bottom:1px dashed rgba(217,119,6,0.8);display:flex;align-items:center;justify-content:center";_tb.innerHTML='<span style="background:rgba(0,0,0,0.45);color:#fdba74;font-size:'+Math.max(9,Math.min(12,_ti*0.45))+'px;padding:1px 8px;border-radius:3px;font-weight:600;letter-spacing:0.5px">Title Bar '+_ti+'px · keep clear</span>';canvas.appendChild(_tb)}const grbox=document.createElement("div");grbox.className="grbox";grbox.id="grbox";canvas.appendChild(grbox);const grh_tl=document.createElement("div");grh_tl.className="grh";grh_tl.id="grh_tl";grh_tl.style.cursor="nw-resize";canvas.appendChild(grh_tl);const grh_tr=document.createElement("div");grh_tr.className="grh";grh_tr.id="grh_tr";grh_tr.style.cursor="ne-resize";canvas.appendChild(grh_tr);const grh_bl=document.createElement("div");grh_bl.className="grh";grh_bl.id="grh_bl";grh_bl.style.cursor="sw-resize";canvas.appendChild(grh_bl);const grh_br=document.createElement("div");grh_br.className="grh";grh_br.id="grh_br";grh_br.style.cursor="se-resize";canvas.appendChild(grh_br);
  const page=cp_();if(!page)return;ca.style.backgroundColor=page.bgColor||"#1a1a2e";var _pi=_patIMG(page.bgPattern);var _tl=document.getElementById("tl");if(_pi){ca.style.backgroundImage="";ca.style.backgroundSize="";_tl.style.display="block";_tl.style.backgroundColor=page.bgPatternColor||"#ffffff";_tl.style.webkitMaskImage='url("/uploads/'+_pi.img+'")';_tl.style.maskImage='url("/uploads/'+_pi.img+'")';var _sz3=(page.bgPatternSize||_pi.size)+"px";_tl.style.webkitMaskSize=_sz3+" "+_sz3;_tl.style.maskSize=_sz3+" "+_sz3;_tl.style.webkitMaskRepeat="repeat";_tl.style.maskRepeat="repeat"}else{_tl.style.display="none";ca.style.cssText+=_patCSS(page.bgPattern,page.bgPatternColor||"#ffffff",page.bgPatternSize||60)}
  // 分组色带(编辑区可视化,画在按键下层)
  (profile.groups||[]).forEach(function(g,gi){
    var ks=page.keys.filter(function(k){return k.groups&&k.groups.indexOf(g.id)>=0});
    if(!ks.length)return;
    var gminX=1e9,gminY=1e9,gmaxX=-1e9,gmaxY=-1e9;
    ks.forEach(function(k){var c=k.col||0,r=k.row||0,w=k.w||1,h=k.h||1;
      if(c<gminX)gminX=c;if(r<gminY)gminY=r;if(c+w>gmaxX)gmaxX=c+w;if(r+h>gmaxY)gmaxY=r+h});
    var gb=document.createElement("div");
    gb.style.cssText="position:absolute;left:"+((gminX+panX)*cpx+dw/2)+"px;top:"+((gminY+panY)*cpx+dh/2)+"px;width:"+((gmaxX-gminX)*cpx)+"px;height:"+((gmaxY-gminY)*cpx)+"px;background:"+KB_GROUP_COLORS[gi%3]+";border:1px dashed rgba(255,255,255,0.18);border-radius:8px;pointer-events:none";
    var gl=document.createElement("span");
    gl.style.cssText="position:absolute;top:3px;left:8px;font-size:10px;color:rgba(255,255,255,0.5);line-height:1;pointer-events:none";
    gl.textContent=g.name;
    gb.appendChild(gl);
    canvas.appendChild(gb);
  });
  page.keys.forEach(k=>{
    const col=k.col||0,row=k.row||0,w=k.w||1,h=k.h||1;
    const x=(col+panX)*cpx+dw/2,y=(row+panY)*cpx+dh/2;
    const kw=Math.max(24,w*cs+(w-1)*gp-3),kh=Math.max(24,h*cs+(h-1)*gp-3);
    const sel=(k.id===selKey||selKeys.has(k.id))?" sel":"";
    const _ggr=(k.groups||[]).filter(function(gid){return profile.groups&&profile.groups.some(function(g){return g.id===gid})});
    const _solo=(_ggr.length>0&&selKeys.size===1&&selKey===k.id&&selGroup===null)?" solo":"";
    const el=document.createElement("div");el.className="ck"+sel+_solo+(_ggr.length?" grp":"")+(k.action==="touchpad"?" touchpad":k.action==="balance"?" balance":"");el.dataset.kid=k.id;
    const br='15px';const ff=_gFont?"'"+_gFont+"'":"inherit";const fs=(Math.max(8,Math.min(48,Math.min(kw,kh)*0.25)))+'px';let bg=k.color||'var(--card)';let fc=k.fontColor||((k.bgType==='gradient'&&k.bgGradient)?_autoFc(k.color||'#0f3460',0.7,'#000000'):_autoFc(k.color||'#0f3460',k.bgOpacity!==undefined?k.bgOpacity:1.0,page.bgColor||'#1a1a2e'));if(k.bgType==='gradient'&&k.bgGradient){bg=_gradCSS(k.bgGradient,k.color||'#0f3460')}else if(k.bgType==='image'&&k.bgImage){bg='var(--card) url(/'+k.bgImage+') center/cover'}el.style.cssText=`left:${x}px;top:${y}px;width:${kw}px;height:${kh}px;background:${bg};color:${fc};border-radius:${br};font-family:${ff};font-size:${fs}`;
    if(k.action==='balance'){var _bfc=fc;var _pv=document.createElement('canvas');_pv.width=kw-8;_pv.height=kh-8;_pv.style.borderRadius=br;var _pctx=_pv.getContext('2d'),_pw=_pv.width,_ph=_pv.height;var _pad=Math.max(6,_pw*0.05);var _bsym=_gBalCur==="USD"?"$":"¥";var _sT=k.showFlags?k.showFlags.total!==false:true;var _sP=k.showFlags?k.showFlags.topped!==false:true;var _sG=k.showFlags?k.showFlags.granted!==false:true;var _hBot=_sP||_sG;_pctx.fillStyle='#f59e0b';var _tFs=Math.max(9,Math.min(_ph*0.13,_pw*0.05));_pctx.font='bold '+_tFs+'px '+_gf();_pctx.textAlign='left';_pctx.textBaseline='top';_pctx.fillText('Deepseek',_pad,_ph*0.04);var _hasKey=k.hasApiKey||k.apiKey;if(_sT){var _hFs=_hBot?Math.max(13,Math.min(_ph*0.30,_pw*0.10)):Math.max(16,Math.min(_ph*0.48,_pw*0.13));var _hY=_hBot?_ph*0.20:_ph*0.36;_pctx.fillStyle=_bfc;_pctx.font='bold '+_hFs+'px '+_gf();_pctx.fillText(_hasKey?_bsym+' ---.--':'Input your API Key',_pad,_hY);_pctx.globalAlpha=0.55;_pctx.fillStyle=_bfc;var _sFs=Math.max(7,Math.min(_ph*0.08,_pw*0.03));_pctx.font=_sFs+'px '+_gf();_pctx.fillText('total balance · Off-peak',_pad,_hY+_hFs+1);_pctx.globalAlpha=1;}if(_hBot){var _bY=_ph*0.70;var _bFs=Math.max(9,Math.min(_ph*0.13,_pw*0.05));_pctx.font=_bFs+'px '+_gf();_pctx.textBaseline='middle';if(_sP){_pctx.fillStyle='#f59e0b';_pctx.textAlign='left';_pctx.fillText('Off-peak rate',_pad,_bY);_pctx.fillStyle=_bfc;_pctx.textAlign='right';_pctx.fillText(_bsym+'--.-- out · '+_bsym+'--.-- in',_pw-_pad,_bY);_bY+=_ph*0.15}if(_sG){_pctx.globalAlpha=0.55;_pctx.fillStyle=_bfc;_pctx.textAlign='left';_pctx.fillText('Today spent',_pad,_bY);_pctx.globalAlpha=1;_pctx.fillStyle=_bfc;_pctx.textAlign='right';_pctx.fillText(_bsym+'0.00',_pw-_pad,_bY)}}el.appendChild(_pv);var _rh=document.createElement('div');_rh.className='rh';el.appendChild(_rh)}else if(k.action==="volume"){var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;var _kc2=k.color||"#1a2a2a";_c.fillStyle=_kc2;var _isV=k.layout==="vertical";var _bc2=k.barColor||"#4ade80";if(_isV){var _g=_c.createLinearGradient(0,_h,0,0);_g.addColorStop(0,_bc2+"4d");_g.addColorStop(1,_bc2+"38");_c.fillStyle=_g;_c.fillRect(0,_h*0.3,_w,_h*0.7)}else{var _g2=_c.createLinearGradient(0,0,_w,0);_g2.addColorStop(0,_bc2+"4d");_g2.addColorStop(1,_bc2+"38");_c.fillStyle=_g2;_c.fillRect(0,0,_w*0.7,_h)}var _cx=_w/2,_cy=_h/2;var _mr=Math.min(_w,_h)*0.32;var _ic2=k.iconColor||"#999999";var _ic30=_ic2+"4d";_c.beginPath();_c.arc(_cx,_cy,_mr,0,Math.PI*2);_c.fillStyle=_ic30;_c.fill();_c.beginPath();_c.arc(_cx,_cy,_mr,0,Math.PI*2);_c.strokeStyle=_ic30;_c.lineWidth=1.5;_c.stroke();var _isz=_mr*1.3;if(!window._edVolOnImg){window._edVolOnImg=new Image();window._edVolOnImg.onload=function(){if(profile)rr()};window._edVolOnImg.src="/static/volume-notice.svg";window._edVolOffImg=new Image();window._edVolOffImg.onload=function(){if(profile)rr()};window._edVolOffImg.src="/static/volume-mute.svg"}var _vimg=window._edVolOnImg;if(_vimg&&_vimg.complete&&_vimg.naturalWidth>0){var _tc=document.createElement("canvas");_tc.width=_isz;_tc.height=_isz;var _tx=_tc.getContext("2d");_tx.drawImage(_vimg,0,0,_isz,_isz);_tx.globalCompositeOperation="source-in";_tx.fillStyle=_ic2;_tx.fillRect(0,0,_isz,_isz);_c.drawImage(_tc,_cx-_isz/2,_cy-_isz/2)}el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="mic-mute"){var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;var _cx=_w/2,_cy=_h/2;var _mr=Math.min(_w,_h)*0.32;var _mc=k.micColor||"#999999";var _lc=k.micLevelColor||"#4ade80";for(var _ring=0;_ring<3;_ring++){var _rR=_mr+4+_ring*8+(_ring+1)*3;_c.beginPath();_c.arc(_cx,_cy,_rR,0,Math.PI*2);_c.strokeStyle=_hexToRgba(_lc,0.10+_ring*0.08);_c.lineWidth=2;_c.stroke()}_c.beginPath();_c.arc(_cx,_cy,_mr,0,Math.PI*2);_c.fillStyle=_hexToRgba(_mc,0.30);_c.fill();_c.beginPath();_c.arc(_cx,_cy,_mr,0,Math.PI*2);_c.strokeStyle=_hexToRgba(_mc,0.30);_c.lineWidth=1.5;_c.stroke();var _isz=_mr*1.3;if(!window._edMicOnImg){window._edMicOnImg=new Image();window._edMicOnImg.onload=function(){if(profile)rr()};window._edMicOnImg.src="/static/voice.svg";window._edMicOffImg=new Image();window._edMicOffImg.onload=function(){if(profile)rr()};window._edMicOffImg.src="/static/voice-off.svg"}var _eimg=window._edMicOnImg;if(_eimg&&_eimg.complete&&_eimg.naturalWidth>0){var _tc=document.createElement("canvas");_tc.width=_isz;_tc.height=_isz;var _tx=_tc.getContext("2d");_tx.drawImage(_eimg,0,0,_isz,_isz);_tx.globalCompositeOperation="source-in";_tx.fillStyle=_mc;_tx.fillRect(0,0,_isz,_isz);_c.drawImage(_tc,_cx-_isz/2,_cy-_isz/2)}el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="audio-in"){var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;var _fc=_autoFc(k.color||"#1a2a2a",1.0);_c.fillStyle=k.color||"#1a2a2a";var _pad=Math.max(6,_w*0.04);var _fs=Math.max(8,Math.min(48,Math.min(_w,_h)*0.25));var _lfs=Math.max(8,_fs*0.5);var _nfs=Math.max(10,_fs*0.75);_c.globalAlpha=0.55;_c.fillStyle=_fc;_c.font=_lfs+"px "+_gf();_c.textAlign="left";_c.textBaseline="middle";_c.fillText("Input Source",_pad,_h*0.30);_c.globalAlpha=1;_c.fillStyle=_fc;_c.font="bold "+_nfs+"px "+_gf();_c.textBaseline="middle";_c.fillText("Input Device",_pad,_h*0.70);el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="audio-out"){var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;var _fc=_autoFc(k.color||"#1a1a2a",1.0);_c.fillStyle=k.color||"#1a1a2a";var _pad=Math.max(6,_w*0.04);var _fs=Math.max(8,Math.min(48,Math.min(_w,_h)*0.25));var _lfs=Math.max(8,_fs*0.5);var _nfs=Math.max(10,_fs*0.75);_c.globalAlpha=0.55;_c.fillStyle=_fc;_c.font=_lfs+"px "+_gf();_c.textAlign="left";_c.textBaseline="middle";_c.fillText("Output Source",_pad,_h*0.30);_c.globalAlpha=1;_c.fillStyle=_fc;_c.font="bold "+_nfs+"px "+_gf();_c.textBaseline="middle";_c.fillText("Output Device",_pad,_h*0.70);el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="win-shortcuts"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height,_gw=_w/3,_gh=_h/3,_pd=Math.min(_gw,_gh)*0.12;
    [[0,1,"up"],[1,0,"left"],[1,1,"center"],[1,2,"right"],[2,1,"down"]].forEach(function(cl){
      var _x=cl[1]*_gw+_pd,_y=cl[0]*_gh+_pd,_bw2=_gw-2*_pd,_bh2=_gh-2*_pd;
      _c.fillStyle="rgba(255,255,255,0.08)";_c.fillRect(_x,_y,_bw2,_bh2);
      _c.strokeStyle="rgba(255,255,255,0.18)";_c.lineWidth=1;_c.strokeRect(_x,_y,_bw2,_bh2);
      _c.fillStyle="#cfd8dc";_edWinArrow(_c,cl[2],_x+_bw2/2,_y+_bh2/2,Math.min(_bw2,_bh2)*0.26);
    });
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="win-gesture"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height,_m=Math.min(_w,_h),_cx=_w/2,_cy=_h/2,_R=_m*0.40,_kr=_m*0.17,_norm=k.iconColor||"#cfd8dc";
    _c.fillStyle=k.color||"#1a2a2a"
    _c.beginPath();_c.arc(_cx,_cy,_R,0,Math.PI*2);_c.fillStyle="rgba(255,255,255,0.05)";_c.fill();_c.strokeStyle="rgba(255,255,255,0.18)";_c.lineWidth=1;_c.beginPath();_c.arc(_cx,_cy,_R,0,Math.PI*2);_c.stroke();
    var _ar=_R*0.80,_as=_m*0.05;_c.fillStyle="rgba(207,216,220,0.5)";_edWinArrow(_c,"up",_cx,_cy-_ar,_as);_edWinArrow(_c,"down",_cx,_cy+_ar,_as);_edWinArrow(_c,"left",_cx-_ar,_cy,_as);_edWinArrow(_c,"right",_cx+_ar,_cy,_as);
    _c.beginPath();_c.arc(_cx,_cy,_kr,0,Math.PI*2);_c.fillStyle="rgba(255,255,255,0.10)";_c.fill();_c.strokeStyle=_norm;_c.lineWidth=1.4;_c.beginPath();_c.arc(_cx,_cy,_kr,0,Math.PI*2);_c.stroke();
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="dock"){
    // Frosted glass via CSS on container
    var _dc2=k.bgColor||k.color||null;
    var _bgo2=k.bgOpacity!==undefined?k.bgOpacity:0.15;
    if(_bgo2>0.001&&_dc2){
      el.style.background=_hexToRgba(_dc2,_bgo2);
      
    }else{el.style.background="transparent"}
    var _cv=document.createElement("canvas");_cv.width=kw;_cv.height=kh;_cv.style.borderRadius=br;
    el.appendChild(_cv);
    _cv._fontColor=_autoFc(_dc2||"#000000",_bgo2,page.bgColor||"#1a1a2e");
    _drawEditorDock(_cv, k);
    var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="active-app"){var _afc=_autoFc(k.color||"#1a1a1a",1.0);
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height;
    var _kc2=k.color||"#1a1a1a";_c.fillStyle=_kc2
    var _pad=2,_gap=1,_headerH=Math.max(10,_h*0.06),_btnSz=Math.floor((_w-_pad*2)/3);
    if(_btnSz<12)_btnSz=12;var _apps2=[{n:"Chrome",w:[{t:"GH",f:!0},{t:"YT",f:!1}]},{n:"Finder",w:[{t:"~",f:!1},{t:"DL",f:!1}]}];
    var _cy=_pad;var _bfs=Math.max(5,Math.floor(_btnSz*0.12));
    for(var _ai=0;_ai<_apps2.length;_ai++){var _ap=_apps2[_ai],_ws=_ap.w;
    if(_cy+_headerH<=_h){_c.globalAlpha=0.7;_c.fillStyle=_afc;_c.font="bold "+Math.floor(_headerH*0.6)+"px "+_gf();_c.textAlign="left";_c.textBaseline="middle";_c.fillText(_ap.n,_pad+1,_cy+_headerH/2);_c.globalAlpha=1}
    _cy+=_headerH;
    for(var _wi=0;_wi<_ws.length;_wi++){var _it=_ws[_wi],_bx=_pad+_wi*(_btnSz+_gap),_by=_cy;
    if(_by+_btnSz<=_h){_c.fillStyle=_it.f?"rgba(74,222,128,0.15)":"rgba(255,255,255,0.05)";_c.fillRect(_bx,_by,_btnSz,_btnSz);if(_it.f){_c.strokeStyle="rgba(74,222,128,0.4)";_c.lineWidth=1;_c.strokeRect(_bx+0.5,_by+0.5,_btnSz-1,_btnSz-1)}
    _c.fillStyle=_it.f?"#4ade80":_afc;_c.font=_bfs+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText(_it.t,_bx+_btnSz/2,_by+_btnSz/2)}}
    _cy+=_btnSz+_gap;if(_ai<_apps2.length-1){_c.strokeStyle="rgba(255,255,255,0.08)";_c.lineWidth=0.5;_c.beginPath();_c.moveTo(_pad,_cy);_c.lineTo(_w-_pad,_cy);_c.stroke()}}
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)}else if(k.action==="fullscreen"){var _ffc=_autoFc(k.color||"#1a3a2a",1.0);
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height,_cx=_w/2,_cy=_h/2;
    var _si=k.showIcon!==false,_sl=k.showLabel!==false;
    _c.fillStyle=k.color||"#1a3a2a"
    if(_si&&_sl){
      var _fs=Math.min(_w,_h),_fs2=k.iconSize||Math.round(_fs*0.40),_gap=_fs2*0.16,_lw=Math.max(1.2,_fs2*0.09);
      var _icY=_cy-_fs2*0.18,_tcY=_cy+_fs2*0.52;
      _c.strokeStyle="rgba(255,255,255,0.8)";_c.lineWidth=_lw;
      _c.beginPath();_c.moveTo(_cx-_fs2/2,_icY-_fs2/2+_gap);_c.lineTo(_cx-_fs2/2,_icY-_fs2/2);_c.lineTo(_cx-_fs2/2+_gap,_icY-_fs2/2);_c.stroke();
      _c.beginPath();_c.moveTo(_cx+_fs2/2,_icY+_fs2/2-_gap);_c.lineTo(_cx+_fs2/2,_icY+_fs2/2);_c.lineTo(_cx+_fs2/2-_gap,_icY+_fs2/2);_c.stroke();
      _c.beginPath();_c.moveTo(_cx+_fs2/2,_icY-_fs2/2+_gap);_c.lineTo(_cx+_fs2/2,_icY-_fs2/2);_c.lineTo(_cx+_fs2/2-_gap,_icY-_fs2/2);_c.stroke();
      _c.beginPath();_c.moveTo(_cx-_fs2/2,_icY+_fs2/2-_gap);_c.lineTo(_cx-_fs2/2,_icY+_fs2/2);_c.lineTo(_cx-_fs2/2+_gap,_icY+_fs2/2);_c.stroke();
      _c.fillStyle=_ffc;var _tf2=Math.max(8,Math.round(Math.min(_h*0.17,_w*0.09)));_c.font="bold "+_tf2+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText("Fullscreen",_cx,_tcY)
    }else if(_si){
      var _fs=k.iconSize||Math.round(Math.min(_w,_h)*0.50),_gap=_fs*0.16,_lw=Math.max(1.2,_fs*0.10);
      _c.strokeStyle="rgba(255,255,255,0.85)";_c.lineWidth=_lw;
      _c.beginPath();_c.moveTo(_cx-_fs/2,_cy-_fs/2+_gap);_c.lineTo(_cx-_fs/2,_cy-_fs/2);_c.lineTo(_cx-_fs/2+_gap,_cy-_fs/2);_c.stroke();
      _c.beginPath();_c.moveTo(_cx+_fs/2,_cy+_fs/2-_gap);_c.lineTo(_cx+_fs/2,_cy+_fs/2);_c.lineTo(_cx+_fs/2-_gap,_cy+_fs/2);_c.stroke();
      _c.beginPath();_c.moveTo(_cx+_fs/2,_cy-_fs/2+_gap);_c.lineTo(_cx+_fs/2,_cy-_fs/2);_c.lineTo(_cx+_fs/2-_gap,_cy-_fs/2);_c.stroke();
      _c.beginPath();_c.moveTo(_cx-_fs/2,_cy+_fs/2-_gap);_c.lineTo(_cx-_fs/2,_cy+_fs/2);_c.lineTo(_cx-_fs/2+_gap,_cy+_fs/2);_c.stroke()
    }else{
      _c.fillStyle=_ffc;var _tf2=Math.max(10,Math.round(Math.min(_h*0.40,_w*0.16)));_c.font="bold "+_tf2+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText("Fullscreen",_cx,_cy)
    }
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)
  }else if(k.action==="switch-profile"){var _sfc=_autoFc(k.color||"#2a1a3a",1.0);
    var _fn=k.targetProfile||"";if(_fn==="none")_fn="";if(!_fn&&k.holdProfile&&k.holdProfile!=="none")_fn=k.holdProfile;
    var _lbl;if(!_fn)_lbl="None";else _lbl=(profiles.find(function(p){return p.filename===_fn})||{}).profileName||_fn.replace(".json","");
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;
    var _c=_cv.getContext("2d"),_w=_cv.width,_h=_cv.height,_cx=_w/2,_cy=_h/2;
    var _si=k.showIcon!==false,_sl=k.showLabel!==false,_ic=k.iconColor||"#a78bfa";
    _c.fillStyle=k.color||"#2a1a3a"
    if(_si&&_sl){
      var _icY=_cy-Math.min(_h,_w)*0.12,_tcY=_cy+Math.min(_h,_w)*0.30;
      var _as=(k.iconSize||Math.round(Math.min(_w*0.35,_h*0.32)));_c.fillStyle=_ic;_c.font="bold "+_as+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText("⇄",_cx,_icY);
      _c.fillStyle=_sfc;var _tf3=Math.max(8,Math.round(Math.min(_h*0.18,_w*0.09)));_c.font=_tf3+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText(_lbl,_cx,_tcY)
    }else if(_si){
      var _as=(k.iconSize||Math.round(Math.min(_w*0.55,_h*0.50)));_c.fillStyle=_ic;_c.font="bold "+_as+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText("⇄",_cx,_cy)
    }else{
      _c.fillStyle=_sfc;var _tf3=Math.max(10,Math.round(Math.min(_h*0.35,_w*0.15)));_c.font=_tf3+"px "+_gf();_c.textAlign="center";_c.textBaseline="middle";_c.fillText(_lbl,_cx,_cy)
    }
    el.appendChild(_cv);var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)
  }else if(k.action==="text-macro"){
    var _cv=document.createElement("canvas");_cv.width=kw-8;_cv.height=kh-8;_cv.style.borderRadius=br;
    el.appendChild(_cv);
    var _kcrgba=k.color;var _bgop2=k.bgOpacity!==undefined?k.bgOpacity:1.0;
    if(_bgop2<1.0&&_kcrgba&&_kcrgba.charAt(0)==='#'){_kcrgba=_hexToRgba(_kcrgba,_bgop2)}
    _drawTextMacroBtn(_cv,_kcrgba,k.macroText||"",k.fontColor||_autoFc(k.color||'#1a2a1a',_bgop2,page.bgColor||'#1a1a2e'),k.label);
    var _rh=document.createElement("div");_rh.className="rh";el.appendChild(_rh)
  }else{var _shI=k.showIcon===true,_shL=k.showLabel!==false,_icSvg=(_shI&&k.icon&&window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.svg[k.icon])||null;if(_icSvg){el.style.flexDirection="column";var _icH=Math.min(kw,kh)*(_shL?0.50:1.0);el.innerHTML='<span style="pointer-events:none;display:flex;align-items:center;justify-content:center;width:100%;height:'+_icH.toFixed(1)+'px;color:'+(k.iconColor||"inherit")+'">'+_icSvg.replace("<svg ","<svg style=\"width:"+(_shL?"85":"78")+"%;height:"+(_shL?"85":"78")+"%;display:block\" ")+'</span>'+(_shL?'<span class="kl" style="display:flex;align-items:center;justify-content:center;width:100%;flex:1;min-height:0;line-height:1.15;padding:0 2px">'+hesc(k.label||"")+'</span>':'')+(w>1||h>1?'<span class="sz">'+w.toFixed(2)+'×'+h.toFixed(2)+'</span>':'')+(selKeys.size<=1?'<div class="rh"></div>':'')}else{el.innerHTML='<span class="kl">'+hesc(k.label)+'</span>'+(w>1||h>1?'<span class="sz">'+w.toFixed(2)+'×'+h.toFixed(2)+'</span>':'')+(selKeys.size<=1?'<div class="rh"></div>':'')}}if(k.action!=='dock'){var _bgop=k.bgOpacity!==undefined?k.bgOpacity:1.0;var _bgc=k.color||null;if(!_bgc){el.style.background='transparent'}else if(_bgc.charAt(0)==='#'){el.style.background=_hexToRgba(_bgc,_bgop)}else{el.style.background=_bgc}}    el.addEventListener("mousedown",e=>onKeyDown(e,k.id));
    el.addEventListener("click",e=>onKeyClick(e,k.id));
    const rh=el.querySelector(".rh");if(rh)rh.addEventListener("mousedown",e=>onRS(e,k.id));
    var _sdb=document.createElement("span");_sdb.className="sd-badge";
    var _esnd=(k.sound||(profile&&profile.defaultSound)||"click");
    _sdb.textContent=_seSoundLabel(_esnd);
    _sdb.style.fontSize=Math.max(8,Math.min(12,Math.min(kw,kh)*0.16))+"px";
    _sdb.style.color=(k.sound&&typeof _SE_COLORS!=="undefined"&&_SE_COLORS)?(_SE_COLORS[k.sound]||"#ccc"):"#9a938a";
    if(!k.sound)_sdb.classList.add("sd-inh");
    if(_seOpen)el.title="Sound: "+(k.sound?_seSoundLabel(k.sound):"Inherit ("+_seSoundLabel(_esnd)+")");
    el.appendChild(_sdb);
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
  if(_seOpen)_seRefresh();

// Group resize functions
function grResizeStart(e,corner){
  e.preventDefault();e.stopPropagation();
  var page=cp_();if(!page)return;
  var cs2=profile.cellSize||60,gp2=profile.gap||0,cpx2=cs2+gp2;
  var scale2=_totalScale();
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
    _setDirty();rr();
  }
  function mu(){
    document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);
    var now=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});
    if(JSON.stringify(orig)!==JSON.stringify(now))_pushUndo(orig);
  }
  // Lower opacity immediately on mousedown
  selKeys.forEach(function(id){
    var el = document.querySelector('.ck[data-kid="' + id + '"]');
    if (el) el.style.opacity = '0.6';
  });
  document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);
}

  // Elevate selected keys to top
  canvas.querySelectorAll(".ck").forEach(function(el) {
    el.style.zIndex = (selKey && el.dataset.kid === selKey) || selKeys.has(el.dataset.kid) ? "999" : "";
  });
}

// Key click: select or Shift-toggle(成组按键的选择由 onKeyDown 决定,此处跳过以免覆盖)
function onKeyClick(e,kid){
  e.stopPropagation();
  const _gk2=cp_()?.keys.find(x=>x.id===kid);
  const _gg2=(_gk2&&_gk2.groups||[]).filter(function(gid){return profile.groups&&profile.groups.some(function(g){return g.id===gid})});
  if(_gg2.length)return;
  if(!e.shiftKey){selKeys.clear();selKeys.add(kid)}
  selKey=kid;rr();rpr();
}

// Key drag: multi-select aware, 0.25 snap, collision
function onKeyDown(e,kid){
  if(e.button!==0)return;e.stopPropagation();_animCancel();
  // 成组按键:单击=整组选中,双击(350ms 内同键再按)=单选该键;Shift 仍走单键切换
  const _gk=cp_()?.keys.find(x=>x.id===kid);
  const _gg=(_gk&&_gk.groups||[]).filter(function(gid){return profile.groups&&profile.groups.some(function(g){return g.id===gid})});
  if(!e.shiftKey&&_gg.length){
    const now=Date.now();
    if(_lastTapKid===kid&&now-_lastTapT<350){
      _lastTapT=0;_lastTapKid=null;
      selKeys.clear();selKeys.add(kid);selKey=kid;selGroup=null;
    }else{
      _lastTapT=now;_lastTapKid=kid;
      if(!selKeys.has(kid)){
        selKeys.clear();
        cp_().keys.forEach(function(kk){if((kk.groups||[]).some(function(g){return _gg.indexOf(g)>=0}))selKeys.add(kk.id)});
        selKey=null;selGroup=_gg[0];rgrp();
      }
    }
  }else if(e.shiftKey&&selKeys.has(kid)){selKeys.delete(kid);selKey=null;selGroup=null}else if(!selKeys.has(kid)){if(!e.shiftKey){selKeys.clear()}selKeys.add(kid);selKey=kid;selGroup=null}
rr();rpr();
  const k=cp_()?.keys.find(x=>x.id===kid);if(!k)return;
  const cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;
  const scale=_totalScale();
  const startX=e.clientX,startY=e.clientY;
  const moved=[];selKeys.forEach(id=>{const kk=cp_()?.keys.find(x=>x.id===id);if(kk)moved.push({id,scol:kk.col||0,srow:kk.row||0})});
  const before=cp_()?.keys.filter(kk=>selKeys.has(kk.id)).map(kk=>_snapshot(kk))||[];
  function mm(ev){
    selKeys.forEach(function(id){
      var el = document.querySelector('.ck[data-kid="' + id + '"]');
      if (el) el.style.opacity = '0.6';
    });
    const dx=(ev.clientX-startX)/(cpx*scale),dy=(ev.clientY-startY)/(cpx*scale);
    let anyMoved=false;
    const newPos=moved.map(m=>{const nc=_snap4(m.scol+dx),nr=_snap4(m.srow+dy);return{...m,nc,nr}});
    newPos.forEach(m=>{const kk=cp_()?.keys.find(x=>x.id===m.id);if(kk&&(kk.col!==m.nc||kk.row!==m.nr)){kk.col=m.nc;kk.row=m.nr;anyMoved=true}});
    if(anyMoved){_setDirty();rr();selKey=kid}
    selKeys.forEach(function(id){
      var el = document.querySelector('.ck[data-kid="' + id + '"]');
      if (el) el.style.opacity = '0.6';
    });
  }
  function mu(ev){
    selKeys.forEach(function(id){
      var el = document.querySelector('.ck[data-kid="' + id + '"]');
      if (el) el.style.opacity = '';
    });
    document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);
    const now=cp_()?.keys.filter(kk=>selKeys.has(kk.id)).map(kk=>_snapshot(kk))||[];
    if(!undoStack.length||JSON.stringify(undoStack[undoStack.length-1].before)!==JSON.stringify(now)){if(JSON.stringify(before)!==JSON.stringify(now)){_pushUndo(before)}}
  }
  // Lower opacity immediately on mousedown
  selKeys.forEach(function(id){
    var el = document.querySelector('.ck[data-kid="' + id + '"]');
    if (el) el.style.opacity = '0.6';
  });
  document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);
}

// Key resize: 0.25 snap, collision, Shift=left resize
function onRS(e,kid){
  _animCancel();
  const _gk=cp_()?.keys.find(x=>x.id===kid);
  const _gg=(_gk&&_gk.groups||[]).filter(function(gid){return profile.groups&&profile.groups.some(function(g){return g.id===gid})});
  if(_gg.length&&!(selKey===kid&&selGroup===null&&selKeys.size===1))return;
  e.preventDefault();e.stopPropagation();selKey=kid;selKeys.clear();selKeys.add(kid);rr();rpr();
  const k=cp_()?.keys.find(x=>x.id===kid);if(!k)return;
  const cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;
  const scale=_totalScale();
  const startX=e.clientX,startY=e.clientY,startW=k.w||1,startH=k.h||1,startCol=k.col||0;
  const before=_snapshot(k);
  function mm(ev){
    const dw_=_snap4((ev.clientX-startX)/(cpx*scale)),dh_=_snap4((ev.clientY-startY)/(cpx*scale));
    const nw=Math.max(0.25,_snap4(startW+dw_)),nh=Math.max(0.25,_snap4(startH+dh_));
    const ncol=ev.shiftKey?_snap4(startCol-dw_):startCol;
    if(nw!==k.w||nh!==k.h||ncol!==k.col){k.col=ncol;k.w=nw;k.h=nh;_setDirty();rr();selKey=kid}
  }
  function mu(){document.removeEventListener("mousemove",mm);document.removeEventListener("mouseup",mu);if(JSON.stringify(before)!==JSON.stringify(_snapshot(k))){_pushUndo([before])}}
  // Lower opacity immediately on mousedown
  selKeys.forEach(function(id){
    var el = document.querySelector('.ck[data-kid="' + id + '"]');
    if (el) el.style.opacity = '0.6';
  });
  document.addEventListener("mousemove",mm);document.addEventListener("mouseup",mu);
}

// Dblclick to add key (0.25 snap)


// ── Carea: left=select rect, right=pan, Space+left=pan ──
var _libItems=document.querySelectorAll(".lib-item");var _libIcons={key:"keycap",keyboard:"keyboard",volume:"volume-loud",micmute:"mic",audioout:"speaker",audioin:"mic-2",imeswitch:"global",activeapp:"monitor",wingesture:"layers",fullscreen:"fullscreen",dock:"widget",switchprofile:"restart",balance:"chart",textmacro:"text-field",touchpad:"mouse"};for(var _li=0;_li<_libItems.length;_li++){var _lit=_libItems[_li];var _lin=_libIcons[_lit.dataset.widget];var _lic=_lit.querySelector(".lib-ic");if(_lic&&_lin&&window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.svg[_lin]){_lic.innerHTML=window.TAPFLOW_ICONS.svg[_lin]}else if(_lic){_lic.style.background="none"}_lit.addEventListener("dragstart",function(e){e.dataTransfer.setData("text/plain",this.dataset.widget);e.dataTransfer.effectAllowed="copy"})}document.addEventListener("dragover",function(e){e.preventDefault();e.dataTransfer.dropEffect="copy";if(_seOpen&&_seDragSound!==null){var _lp0=document.getElementById("lp-panel"),_ca0=document.getElementById("carea");if(_lp0&&_ca0){var _lpr0=_lp0.getBoundingClientRect();var _overLp=e.clientX>=_lpr0.left&&e.clientX<=_lpr0.right&&e.clientY>=_lpr0.top&&e.clientY<=_lpr0.bottom;var _tid=null;if(!_overLp){var _r0=_ca0.getBoundingClientRect();var _sc0=_totalScale(),_vo0=_viewOrigin();var _dx0=(e.clientX-_r0.left-_vo0.ox)/_sc0,_dy0=(e.clientY-_r0.top-_vo0.oy)/_sc0;if(selKeys.size>1){_tid="__sel__"}else{var _h0=_seHitKey(_dx0,_dy0);_tid=_h0?_h0.id:null}}_seSetDropTarget(_tid)}}var _ca=document.getElementById("carea"),_rect=_ca.getBoundingClientRect();if(e.clientX>=_rect.left&&e.clientX<=_rect.right&&e.clientY>=_rect.top&&e.clientY<=_rect.bottom){var _gh=document.getElementById("gh");_gh.style.display="block";_gh.style.left=(e.clientX-_rect.left-10)+"px";_gh.style.top=(e.clientY-_rect.top-10)+"px";_gh.style.width="20px";_gh.style.height="20px"}});document.addEventListener("drop",function(e){e.preventDefault();document.getElementById("gh").style.display="none";document.body.style.cursor="";var type=e.dataTransfer.getData("text/plain");if(!type||!profile)return;var _ca2=document.getElementById("carea"),_rect2=_ca2.getBoundingClientRect();var dw=profile.deviceWidth||1210,dh=profile.deviceHeight||834,cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;var scale=_totalScale();var vo=_viewOrigin();var dx=(e.clientX-_rect2.left-vo.ox)/scale,dy=(e.clientY-_rect2.top-vo.oy)/scale;if(_seOpen&&type.indexOf("__sound__:")===0){_seDragSound=null;var _lp1=document.getElementById("lp-panel"),_lpr1=_lp1.getBoundingClientRect();if(e.clientX>=_lpr1.left&&e.clientX<=_lpr1.right&&e.clientY>=_lpr1.top&&e.clientY<=_lpr1.bottom){_seClearDropTarget();return}_seDropSound(type.slice(10),dx,dy);return}window._pendingCol=_snap4((dx-dw/2)/cpx-panX);window._pendingRow=_snap4((dy-dh/2)/cpx-panY);var tw=type==="touchpad"?4:1,th=type==="touchpad"?3:1;{if(type==="__clipboard__"){_pasteFromClipboard(window._pendingCol,window._pendingRow)}else if(type==="keyboard"){openKbPicker("create")}else{addKeyOfType(type)}}});
document.addEventListener("dragend",function(){_seDragSound=null;_seClearDropTarget()});
const carea=document.getElementById("carea");

carea.addEventListener("mousedown",e=>{
  _animCancel();
  if(e.button===0&&!e.target.closest(".ck")&&!e.target.closest(".grh")){
    selecting=true;
    srSX=e.clientX;srSY=e.clientY;srCX=e.clientX;srCY=e.clientY;
    if(!e.shiftKey){selKeys.clear();selKey=null;selGroup=null;rr();rpr()}
    e.preventDefault();
  }else if(e.button===2){
    panning=true;panStartX=e.clientX;panStartY=e.clientY;mx=viewX;my=viewY;panShiftLock=null;e.preventDefault();
  }
});
carea.addEventListener("contextmenu",e=>{e.preventDefault()});

// ── Document mousemove: selection rect or viewport pan (right-drag) ──
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
  const wasLocked=panShiftLock;
  if(!e.shiftKey){panShiftLock=null}
  else if(panShiftLock===null){
    const adx=Math.abs(e.clientX-panStartX),ady=Math.abs(e.clientY-panStartY);
    if(adx>3||ady>3)panShiftLock=adx>=ady?'x':'y';
  }
  if(wasLocked==='y'&&!panShiftLock)panStartX=e.clientX;
  if(wasLocked==='x'&&!panShiftLock)panStartY=e.clientY;
  if(panShiftLock!=='y'){viewX+=e.clientX-panStartX;panStartX=e.clientX}
  if(panShiftLock!=='x'){viewY+=e.clientY-panStartY;panStartY=e.clientY}
  rr();
});

// ── Document mouseup: finalize selection / pan ──
document.addEventListener("mouseup",e=>{
  if(selecting){
    selecting=false;
    document.getElementById("sr").style.display="none";
    if(selKeys.size===1)selKey=[...selKeys][0];else selKey=null;
    rr();rpr();
  }
  if(panning){
    panning=false;panShiftLock=null;
    rr();
  }
});

// ── Zoom ──
carea.addEventListener("wheel",e=>{e.preventDefault();_animCancel();const f=e.deltaY>0?0.9:1.1;const nz=Math.max(0.3,Math.min(3,viewZoom*f));const ca=e.currentTarget,rect=ca.getBoundingClientRect(),mx=e.clientX-rect.left-ca.clientWidth/2,my=e.clientY-rect.top-ca.clientHeight/2,s=nz/viewZoom;viewX=mx-s*(mx-viewX);viewY=my-s*(my-viewY);viewZoom=nz;rr()},{passive:false});
var _animT=null;
function _animCancel(){if(_animT){cancelAnimationFrame(_animT);_animT=null}profile.cellSize=Math.round(profile.cellSize||60)}
function _animateTo(to,dur){dur=dur||200;var from={cellSize:profile.cellSize||60,panX:panX,panY:panY,viewX:viewX,viewY:viewY,viewZoom:viewZoom};to=Object.assign({},from,to);var t0=performance.now();if(_animT)cancelAnimationFrame(_animT);(function step(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);profile.cellSize=from.cellSize+(to.cellSize-from.cellSize)*e;panX=from.panX+(to.panX-from.panX)*e;panY=from.panY+(to.panY-from.panY)*e;viewX=from.viewX+(to.viewX-from.viewX)*e;viewY=from.viewY+(to.viewY-from.viewY)*e;viewZoom=from.viewZoom+(to.viewZoom-from.viewZoom)*e;rr();if(p<1){_animT=requestAnimationFrame(step)}else{_animT=null;profile.cellSize=Math.round(to.cellSize);panX=to.panX;panY=to.panY;viewX=to.viewX;viewY=to.viewY;viewZoom=to.viewZoom;rr()}})(t0)}
function fitAll(){if(!profile)return;var page=profile.pages.find(function(p){return p.id===activePage});if(!page||!page.keys.length)return;var cs=profile.cellSize||60,gp=profile.gap||0,dw=profile.deviceWidth||1210,dh=profile.deviceHeight||834;var cpx=cs+gp;var minC=Infinity,minR=Infinity,maxC=-Infinity,maxR=-Infinity;page.keys.forEach(function(k){var c=k.col||0,r=k.row||0,w=k.w||1,h=k.h||1;if(c<minC)minC=c;if(r<minR)minR=r;if(c+w>maxC)maxC=c+w;if(r+h>maxR)maxR=r+h});if(minC===Infinity)return;var cols=maxC-minC,rows=maxR-minR;var kw=cols*cpx-gp,kh=rows*cpx-gp;var pad=0;var ti=profile.topInset||0;var usableH=dh-ti;if(usableH<=0){usableH=dh;ti=0}var scale=Math.min((dw-pad*2)/kw,(usableH-pad*2)/kh,2.5);var newCs=Math.max(15,Math.floor(cs*scale));var centerC=(minC+maxC)/2,centerR=(minR+maxR)/2;var tiOff=ti/(2*(newCs+gp));profile.canvasX=-centerC;profile.canvasY=-centerR+tiOff;_animateTo({cellSize:newCs,panX:-centerC,panY:-centerR+tiOff,viewX:0,viewY:0,viewZoom:1});_setDirty()}
function zoomBy(d){const nv=Math.max(20,Math.min(200,(profile.cellSize||60)+d));if(nv!==profile.cellSize){_animateTo({cellSize:nv});_setDirty()}}
function toggleOri(){const t=profile.deviceWidth;profile.deviceWidth=profile.deviceHeight;profile.deviceHeight=t;_setDirty();rr();fitAll()}
function applyRatioByIndex(i){var k=Object.keys(DEVS)[i];var d=DEVS[k];if(d&&profile){profile.device=k;profile.deviceWidth=d.portrait?Math.min(d.w,d.h):Math.max(d.w,d.h);profile.deviceHeight=d.portrait?Math.max(d.w,d.h):Math.min(d.w,d.h);profile.dpr=d.dpr||0;profile.topInset=d.topInset||0;_setDirty();rr();fitAll()}updateRatioInfo();buildRatioPresets()}
function applyCustomRatio(){if(!profile)return false;var cur=(profile.deviceWidth||1210)+"x"+(profile.deviceHeight||834);var inp=prompt("Custom canvas WxH (logical px, e.g. 1280x800):",cur);if(!inp)return false;var mm=inp.replace(/[×,\s]/g,"x").split("x");var w=parseInt(mm[0],10),h=parseInt(mm[1],10);if(!(w>0&&h>0&&w<=8000&&h<=8000)){alert("Enter valid pixels, e.g. 1280x800");return false}profile.dpr=0;profile.topInset=0;if(w>1600||h>1600){var f=prompt(w+"×"+h+" looks like a physical resolution. Enter DPR (2 or 3) to convert to logical pixels, or 0 to keep as-is:","3");if(f==="2"||f==="3"){var dn=parseInt(f,10);w=Math.round(w/dn);h=Math.round(h/dn);profile.dpr=dn}}profile.device="__custom__";profile.deviceWidth=w;profile.deviceHeight=h;_setDirty();rr();fitAll();updateRatioInfo();return true}
function buildRatioPresets(){var el=document.getElementById("ratioModalPresets");if(!el)return;var w=profile?.deviceWidth||0,h=profile?.deviceHeight||0;el.innerHTML=Object.keys(DEVS).map(function(k,i){var d=DEVS[k];var dw=d.portrait?Math.min(d.w,d.h):Math.max(d.w,d.h),dh=d.portrait?Math.max(d.w,d.h):Math.min(d.w,d.h);var cur=(d.w===w&&d.h===h)||(d.w===h&&d.h===w);return '<button onclick="applyRatioByIndex('+i+')" title="'+dw+'×'+dh+'" style="height:24px;padding:0 10px;font-size:10px;background:var(--card);color:var(--text);border:1px solid '+(cur?'var(--accent)':'var(--border)')+';border-radius:4px;cursor:pointer'+(cur?';box-shadow:0 0 8px rgba(217,119,6,0.3);font-weight:600':'')+'">'+hesc(k)+' · '+dw+'×'+dh+'</button>'}).join("")}
function openRatioModal(){var i=document.getElementById("ratioModalInfo"),rc=document.getElementById("ratioCard");if(i)i.textContent="Current: "+(rc&&rc.dataset.full?rc.dataset.full:"—");buildRatioPresets();var _rp=document.getElementById("ratioPanel");if(_rp._rpT){clearTimeout(_rp._rpT);_rp._rpT=null}_rp.classList.remove("rp-out");_rp.style.display="block"}
function closeRatioModal(){var _rp=document.getElementById("ratioPanel");if(_rp._rpT)return;_rp.classList.add("rp-out");_rp._rpT=setTimeout(function(){_rp._rpT=null;_rp.classList.remove("rp-out");_rp.style.display="none"},150)}
function toggleRatioPanel(){if(document.getElementById("ratioPanel").style.display==="block"){closeRatioModal()}else{openRatioModal()}}
function upkTopInset(v){if(!profile)return;var n=Math.max(0,Math.min(300,parseInt(v,10)||0));profile.topInset=n;_setDirty();rr()}
function updateRatioInfo(){if(!profile)return;var w=profile.deviceWidth||1210,h=profile.deviceHeight||834,name=null;for(var k in DEVS){if((DEVS[k].w===w&&DEVS[k].h===h)||(DEVS[k].w===h&&DEVS[k].h===w)){name=k;break}}if(!name)name="Custom "+w+"×"+h;var dpr=profile.dpr||0,ti=profile.topInset||0,phys=dpr>1?" · Physical "+(w*dpr)+"×"+(h*dpr):"";var _ti=document.getElementById("topInsetIn");if(_ti)_ti.value=ti;var nm=document.getElementById("ratioName");if(nm)nm.textContent=name;var det=((w>h)?"Landscape":"Portrait")+" · Logical "+w+"×"+h+(dpr>1?" @ "+dpr+"x":"")+(ti>0?" · Title Bar "+ti+"px":"");var rd=document.getElementById("ratioDetail");if(rd)rd.textContent=det;var rc=document.getElementById("ratioCard");if(rc)rc.dataset.full=name+" · "+det+phys}


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
    ctx.font = fs + "px "+_gf();
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
        ctx.font = "bold " + initFs + "px "+_gf();
        ctx.fillStyle = canvas._fontColor||"#888"; ctx.textBaseline = "middle";
        ctx.fillText(a.name.charAt(0).toUpperCase(), x + iconSize/2, iconY + iconSize/2);
      }
      ctx.fillStyle = canvas._fontColor||"#aaa"; ctx.font = fs + "px "+_gf();
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
  ctx.fillStyle = canvas._fontColor||"#888";
  ctx.font = Math.max(8, h*0.3) + "px "+_gf();
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
// ── Editor Text Macro preview ──
function _drawTextMacroBtn(canvas,bgColor,text,fontColor,label){
  var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle=bgColor||"#1a2a1a";ctx.fillRect(0,0,w,h);
  var fc=fontColor||_autoFc(bgColor||"#1a2a1a"),fs=Math.max(10,Math.min(48,Math.min(w,h)*0.30));
  var padX=Math.max(6,w*0.05);
  var hdrFs=Math.max(8,fs*0.55);
  var topPad=Math.max(5,h*0.10);
  ctx.globalAlpha=0.45;ctx.fillStyle=fc;
  ctx.font=hdrFs+"px "+_gf();
  ctx.textAlign="left";ctx.textBaseline="top";
  ctx.fillText(label||"TEXT MACRO",padX,topPad);ctx.globalAlpha=1;
  var textTop=topPad+hdrFs*1.4+Math.max(2,h*0.04),textH=h-textTop-topPad;
  if(text&&text.length>0){
    var display=text;ctx.fillStyle=fc;ctx.font=fs+"px "+_gf();
    ctx.textAlign="left";ctx.textBaseline="top";
    var maxW=w-padX*2,lineH=fs*1.35,maxLines=textH>=lineH?Math.floor(textH/lineH):(textH>=fs?1:0);
    var lines=[];
    if(display.indexOf("\n")>=0){
      var raw=display.split("\n");
      for(var i=0;i<Math.min(raw.length,maxLines);i++){
        var ln=raw[i];
        if(ctx.measureText(ln).width>maxW){while(ln.length>1&&ctx.measureText(ln+"…").width>maxW)ln=ln.slice(0,-1);ln+="…"}
        lines.push(ln)
      }
    }else if(maxLines>0){
      var ln=display;
      if(ctx.measureText(ln).width>maxW){while(ln.length>1&&ctx.measureText(ln+"…").width>maxW)ln=ln.slice(0,-1);ln+="…"}
      lines.push(ln)
    }
    var totalH=lines.length*lineH;
    var startY=totalH<=textH?textTop+(textH-totalH)/2:textTop+2;
    for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],padX,startY+i*lineH)}
  }else{
    ctx.globalAlpha=0.35;ctx.fillStyle=fc;
    ctx.font=fs+"px "+_gf();
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("(empty)",w/2,textTop+textH/2);ctx.globalAlpha=1
  }
}
