function _wrapText(ctx,text,maxW,maxLines){if(!text)return[""];var lines=[],cur="";for(var i=0;i<text.length;i++){var ch=text[i],test=cur+ch;if(ctx.measureText(test).width>maxW&&cur.length>0){lines.push(cur);if(lines.length>=maxLines)return lines;cur=ch}else{cur=test}}if(cur&&lines.length<maxLines)lines.push(cur);if(lines.length===0)lines=[""];return lines}
function _rrPath(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function _rrFill(ctx,x,y,w,h,r){_rrPath(ctx,x,y,w,h,r);ctx.fill()}
function _rrStroke(ctx,x,y,w,h,r){_rrPath(ctx,x,y,w,h,r);ctx.stroke()}
function _drawWindowSwitcher(canvas){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);var kc=canvas._keyColor||"#1a1a1a";ctx.fillStyle=kc;ctx.fillRect(0,0,w,h);var d=canvas._winData;var apps=d&&d.apps?d.apps:[];canvas._winData=d;canvas._winBtns=[];if(!apps||apps.length===0){ctx.fillStyle="#666";ctx.font="14px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("no windows",w/2,h/2);return}var pad=2,gap=10,divW=10,labelH=Math.max(9,Math.floor(h*0.06));var btnSize=h-pad*2-labelH;if(btnSize<20)btnSize=20;var iconH=Math.floor(btnSize*0.35);var txtY=iconH+2;var txtH=btnSize-txtY-4;var iconSz=Math.floor(iconH*0.65);var lineH=Math.max(6,Math.floor(btnSize*0.10));var maxLines=Math.max(1,Math.floor(txtH/lineH));var btnFs=Math.floor(lineH*0.80);var labelFs=Math.max(7,Math.floor(labelH*0.65));var preTW=0;for(var pai=0;pai<apps.length;pai++){var pw=apps[pai].windows;if(!pw||pw.length===0)continue;preTW+=pw.length*btnSize+(pw.length-1)*gap;if(pai<apps.length-1)preTW+=divW}var visibleW=w-pad*2;var maxScroll=Math.max(0,preTW-visibleW);canvas._maxScroll=maxScroll;var scrollX=canvas._scrollX||0;if(scrollX<0)scrollX=0;if(scrollX>maxScroll)scrollX=maxScroll;canvas._scrollX=scrollX;var startX=pad-scrollX;var curX=startX;var allBtns=[];var focusedBX=-1;for(var ai=0;ai<apps.length;ai++){var app=apps[ai];var wins=app.windows;if(!wins||wins.length===0)continue;var n=wins.length;var appW=n*btnSize+(n-1)*gap;var groupLeft=curX;ctx.fillStyle="rgba(255,255,255,0.55)";ctx.font="bold "+labelFs+"px -apple-system,sans-serif";ctx.textAlign="left";ctx.textBaseline="top";var labelText=app.name;var labelMaxW=appW;var labelW=ctx.measureText(labelText).width;if(labelW>labelMaxW){while(labelText.length>3&&ctx.measureText(labelText+"..").width>labelMaxW)labelText=labelText.slice(0,-1);labelText+=".."}if(curX+labelMaxW>0&&curX<w){ctx.fillText(labelText,curX,pad)}var btnsY=pad+labelH;for(var i=0;i<n;i++){var bx=curX+i*(btnSize+gap);var by=btnsY;var it=wins[i];if(!it)continue;var focused=it.is_focused;var pressedIdx=canvas._wsTappedIdx;var pressed=(pressedIdx!==undefined&&pressedIdx===it.global_index);var holdIdx=canvas._wsLongPressIdx;var holding=(holdIdx!==undefined&&holdIdx===it.global_index);if(focused)focusedBX=bx;if(bx+btnSize>0&&bx<w){var rr0=Math.max(3,Math.floor(btnSize*0.08));var tk0=_thumbKey(app.pid,it);var timg=canvas._winThumbs&&canvas._winThumbs[tk0];if(timg&&timg.width){ctx.save();_rrPath(ctx,bx,by,btnSize,btnSize,rr0);ctx.clip();var s0=Math.max(btnSize/timg.width,btnSize/timg.height);var sw0=btnSize/s0,sh0=btnSize/s0;ctx.drawImage(timg,(timg.width-sw0)/2,(timg.height-sh0)/2,sw0,sh0,bx,by,btnSize,btnSize);var stripH=Math.max(10,lineH+3);ctx.fillStyle="rgba(0,0,0,0.55)";ctx.fillRect(bx,by+btnSize-stripH,btnSize,stripH);var t1=it.title||"(untitled)";ctx.font=btnFs+"px -apple-system,sans-serif";while(t1.length>2&&ctx.measureText(t1).width>btnSize-6)t1=t1.slice(0,-1);ctx.fillStyle=focused?"#4ade80":"#ddd";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(t1,bx+btnSize/2,by+btnSize-stripH/2);ctx.restore();if(holding){ctx.fillStyle="rgba(239,68,68,0.30)";_rrFill(ctx,bx,by,btnSize,btnSize,rr0);ctx.strokeStyle="#ef4444";ctx.lineWidth=2;_rrStroke(ctx,bx+1,by+1,btnSize-2,btnSize-2,rr0)}else if(pressed){ctx.fillStyle="rgba(255,255,255,0.25)";_rrFill(ctx,bx,by,btnSize,btnSize,rr0);ctx.strokeStyle="rgba(255,255,255,0.5)";ctx.lineWidth=2;_rrStroke(ctx,bx+1,by+1,btnSize-2,btnSize-2,rr0)}else if(focused){ctx.strokeStyle="rgba(74,222,128,0.8)";ctx.lineWidth=1.5;_rrStroke(ctx,bx+0.5,by+0.5,btnSize-1,btnSize-1,rr0)}if(it.type==="tab"){ctx.fillStyle=focused?"#4ade80":"rgba(255,255,255,0.6)";var tagFs3=Math.max(5,btnSize*0.07);ctx.font=tagFs3+"px -apple-system,sans-serif";ctx.textAlign="right";ctx.textBaseline="top";ctx.fillText("tab",bx+btnSize-2,by+2)}}else{ctx.fillStyle=holding?"rgba(239,68,68,0.30)":pressed?"rgba(255,255,255,0.25)":(focused?"rgba(74,222,128,0.18)":"rgba(255,255,255,0.06)");_rrFill(ctx,bx,by,btnSize,btnSize,rr0);if(holding){ctx.strokeStyle="#ef4444";ctx.lineWidth=2;_rrStroke(ctx,bx+1,by+1,btnSize-2,btnSize-2,rr0)}else if(pressed){ctx.strokeStyle="rgba(255,255,255,0.5)";ctx.lineWidth=2;_rrStroke(ctx,bx+1,by+1,btnSize-2,btnSize-2,rr0)}else if(focused){ctx.strokeStyle="rgba(74,222,128,0.5)";ctx.lineWidth=1.5;_rrStroke(ctx,bx+0.5,by+0.5,btnSize-1,btnSize-1,rr0)}var cx=bx+btnSize/2;var iconUrl=it.icon_url||"";var icon=it.icon||"";var ix=bx+Math.floor((btnSize-iconSz)/2);var iy=by+Math.floor((iconH-iconSz)/2);if(iconUrl&&canvas._winIcons&&canvas._winIcons[it.global_index]){ctx.drawImage(canvas._winIcons[it.global_index],ix,iy,iconSz,iconSz)}else if(icon==="folder"){var tabW=iconSz*0.3;var tabH=iconSz*0.15;ctx.fillStyle="#6b9bd2";ctx.fillRect(ix,iy,tabW,tabH);ctx.beginPath();ctx.moveTo(ix,iy+tabH);ctx.lineTo(ix+iconSz,iy+tabH);ctx.lineTo(ix+iconSz,iy+iconSz);ctx.lineTo(ix,iy+iconSz);ctx.closePath();ctx.fill();ctx.fillStyle="#82b5ec";ctx.fillRect(ix+2,iy+tabH+2,iconSz-4,iconSz*0.55)}if(it.type==="tab"){ctx.fillStyle=focused?"#4ade80":"rgba(255,255,255,0.3)";var tagFs2=Math.max(5,btnSize*0.07);ctx.font=tagFs2+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="bottom";ctx.fillText("tab",cx,by+btnSize-2)}var text=it.title||"(untitled)";ctx.font=btnFs+"px -apple-system,sans-serif";ctx.fillStyle=focused?"#4ade80":"#999";ctx.textAlign="center";ctx.textBaseline="top";var lines=_wrapText(ctx,text,btnSize-4,maxLines);for(var li=0;li<lines.length;li++){ctx.fillText(lines[li],cx,by+txtY+li*lineH)}}}allBtns.push({x:bx,y:by,w:btnSize,h:btnSize,item:it,app:app})}curX+=appW;if(ai<apps.length-1){curX+=divW}}var totalW=curX-startX;canvas._winBtns=allBtns;canvas._totalW=totalW;canvas._focusedBX=focusedBX;canvas._btnSize=btnSize}
function _fetchAndDrawWindowSwitcher(canvas){if(canvas._wsLoading)return;canvas._wsLoading=true;var ctrl=new AbortController();var tid=setTimeout(function(){ctrl.abort()},10000);fetch("/api/system/all-windows",{signal:ctrl.signal}).then(function(r){return r.json()}).then(function(d){clearTimeout(tid);var isFirstLoad=!canvas._winData;var newFocused=d?d.focused_global_idx:-1;canvas._winData=d;if(isFirstLoad&&newFocused>=0){canvas._scrollX=0}_drawWindowSwitcher(canvas);_loadWinIcons(canvas);_loadWinThumbs(canvas);if(isFirstLoad&&canvas._focusedBX>=0&&(!canvas._wsUserScrolled||Date.now()-canvas._wsUserScrolled>2000)){var visW=canvas.width;var bsz=canvas._btnSize||40;var fb=canvas._focusedBX;canvas._scrollX=Math.max(0,fb-Math.floor(visW/2)+Math.floor(bsz/2));_drawWindowSwitcher(canvas)}canvas._wsLoading=false}).catch(function(){clearTimeout(tid);canvas._wsLoading=false})}
function _thumbKey(pid,it){return pid+":"+it.window_index+":"+(it.tab_index==null?"w":it.tab_index)+":"+(it.title||"")}
function _fetchThumb(canvas,pid,it,refresh){canvas._winThumbs=canvas._winThumbs||{};canvas._thumbFail=canvas._thumbFail||{};var tk=_thumbKey(pid,it);var url="/api/system/window-thumbnail?pid="+pid+"&title="+encodeURIComponent(it.title||"")+(refresh?"&refresh=1":"");fetch(url).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){var img=new Image();img.onload=function(){canvas._winThumbs[tk]=img;URL.revokeObjectURL(img.src);requestAnimationFrame(function(){_drawWindowSwitcher(canvas)})};img.onerror=function(){URL.revokeObjectURL(img.src);canvas._thumbFail[tk]=Date.now()};img.src=URL.createObjectURL(b)}).catch(function(){canvas._thumbFail[tk]=Date.now()})}
function _loadWinThumbs(canvas){var d=canvas._winData;if(!d||!d.apps)return;canvas._winThumbs=canvas._winThumbs||{};canvas._thumbFail=canvas._thumbFail||{};var keep={};var backlog=[];for(var ai=0;ai<d.apps.length;ai++){var app=d.apps[ai];var wins=app.windows||[];for(var i=0;i<wins.length;i++){var it=wins[i];var tk=_thumbKey(app.pid,it);keep[tk]=1;if(it.is_focused){_fetchThumb(canvas,app.pid,it,true)}else if(!canvas._winThumbs[tk]&&(!canvas._thumbFail[tk]||Date.now()-canvas._thumbFail[tk]>60000)){backlog.push([app.pid,it])}}}var lim=canvas._thumbsWarm?2:backlog.length;canvas._thumbsWarm=1;for(var bi=0;bi<Math.min(lim,backlog.length);bi++){_fetchThumb(canvas,backlog[bi][0],backlog[bi][1],false)}for(var k in canvas._winThumbs){if(!keep[k])delete canvas._winThumbs[k]}for(var k2 in canvas._thumbFail){if(!keep[k2])delete canvas._thumbFail[k2]}}
function _loadWinIcons(canvas){var d=canvas._winData;if(!d||!d.apps)return;canvas._winIcons=canvas._winIcons||{};var pending=0;for(var ai=0;ai<d.apps.length;ai++){var wins=d.apps[ai].windows||[];for(var i=0;i<wins.length;i++){var url=wins[i].icon_url;var gidx=wins[i].global_index;if(url&&!canvas._winIcons[gidx]){pending++;(function(idx,u){var img=new Image();img.crossOrigin="anonymous";img.onload=function(){canvas._winIcons[idx]=img;pending--;if(pending<=0)requestAnimationFrame(function(){_drawWindowSwitcher(canvas)})};img.onerror=function(){canvas._winIcons[idx]=null;pending--;if(pending<=0)requestAnimationFrame(function(){_drawWindowSwitcher(canvas)})};img.src=u})(gidx,url)}}}if(pending===0&&canvas._winBtns&&canvas._winBtns.length>0){requestAnimationFrame(function(){_drawWindowSwitcher(canvas)})}}
function _onWindowSwitcherTouchStart(e,canvas){e.stopPropagation();e.preventDefault();var t=e.touches?e.touches[0]:e;var rect=canvas.getBoundingClientRect();canvas._wsTouchSX=t.clientX;canvas._wsTouchTX=Math.round((t.clientX-rect.left)*(canvas.width/rect.width));canvas._wsTouchTY=Math.round((t.clientY-rect.top)*(canvas.height/rect.height));canvas._wsScroll0=canvas._scrollX||0;canvas._wsMoved=false;canvas._wsUserScrolled=Date.now();delete canvas._wsTappedIdx;delete canvas._wsLongPressIdx;if(canvas._wsHoldTimer){clearTimeout(canvas._wsHoldTimer);canvas._wsHoldTimer=null}canvas._wsHoldFired=false;canvas._wsHoldTarget=null;var htx=canvas._wsTouchTX,hty=canvas._wsTouchTY;var hbs=canvas._winBtns||[];for(var hi=0;hi<hbs.length;hi++){var hb=hbs[hi];if(htx>=hb.x&&htx<=hb.x+hb.w&&hty>=hb.y&&hty<=hb.y+hb.h){canvas._wsHoldTarget={item:hb.item,app:hb.app};break}}if(canvas._wsHoldTarget){var _canvas=canvas;canvas._wsHoldTimer=setTimeout(function(){_canvas._wsHoldFired=true;var ht=_canvas._wsHoldTarget;if(!ht)return;_canvas._wsLongPressIdx=ht.item.global_index;psnd(_canvas._closeSound||"quit");_drawWindowSwitcher(_canvas);var payload={pid:ht.app.pid,bundle_id:ht.app.bundle_id||"",window_index:ht.item.window_index,tab_index:ht.item.tab_index,type:ht.item.type,title:ht.item.title,_source:ht.item._source||""};var body=JSON.stringify(payload);var gidx=ht.item.global_index;var closedTitle=ht.item.title;fetch("/api/system/focus-window",{method:"POST",headers:{"Content-Type":"application/json"},body:body}).then(function(){setTimeout(function(){fetch("/api/system/window/close",{method:"POST",headers:{"Content-Type":"application/json"},body:body}).then(function(r){return r.json()}).then(function(d){delete _canvas._wsLongPressIdx;if(_canvas._winData&&_canvas._winData.apps){for(var ai=0;ai<_canvas._winData.apps.length;ai++){var ws=_canvas._winData.apps[ai].windows||[];var before=ws.length;ws=ws.filter(function(w){return w.global_index!==gidx});_canvas._winData.apps[ai].windows=ws}}_drawWindowSwitcher(_canvas);delete _canvas._wsLoading;_fetchAndDrawWindowSwitcher(_canvas);setTimeout(function(){delete _canvas._wsLoading;_fetchAndDrawWindowSwitcher(_canvas)},2000);setTimeout(function(){delete _canvas._wsLoading;_fetchAndDrawWindowSwitcher(_canvas)},5000)}).catch(function(){delete _canvas._wsLongPressIdx;_drawWindowSwitcher(_canvas)})},800)}).catch(function(){delete _canvas._wsLongPressIdx;_drawWindowSwitcher(_canvas)})},600)}}
function _onWindowSwitcherTouchMove(e,canvas){e.preventDefault();var t=e.touches?e.touches[0]:e;var dx=t.clientX-(canvas._wsTouchSX||0);if(Math.abs(dx)>4){canvas._wsMoved=true;if(canvas._wsHoldTimer){clearTimeout(canvas._wsHoldTimer);canvas._wsHoldTimer=null;delete canvas._wsLongPressIdx}}if(canvas._wsMoved){var scale=canvas.width/(canvas.getBoundingClientRect().width||1);var sx=dx*scale;canvas._scrollX=Math.max(0,Math.min(canvas._maxScroll||0,(canvas._wsScroll0||0)-sx));_drawWindowSwitcher(canvas);canvas._wsUserScrolled=Date.now()}}
function _onWindowSwitcherTouchEnd(e,canvas){e.stopPropagation();e.preventDefault();if(canvas._wsHoldTimer){clearTimeout(canvas._wsHoldTimer);canvas._wsHoldTimer=null}if(canvas._wsHoldFired)return;if(canvas._wsMoved){return}var tx=canvas._wsTouchTX;var ty=canvas._wsTouchTY;var btns=canvas._winBtns||[];for(var i=0;i<btns.length;i++){var b=btns[i];if(tx>=b.x&&tx<=b.x+b.w&&ty>=b.y&&ty<=b.y+b.h){var it=b.item;var app=b.app;canvas._wsTappedIdx=it.global_index;psnd(canvas._sound||(profile&&profile.defaultSound)||"click");_drawWindowSwitcher(canvas);fetch("/api/system/focus-window",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pid:app.pid,bundle_id:app.bundle_id||"",window_index:it.window_index,tab_index:it.tab_index,type:it.type,title:it.title,_source:it._source||""})}).then(function(r){return r.json()}).then(function(){var d=canvas._winData;if(d&&d.apps){for(var ai=0;ai<d.apps.length;ai++){var ws=d.apps[ai].windows||[];for(var wi=0;wi<ws.length;wi++){ws[wi].is_focused=(ws[wi].global_index===it.global_index)}}}setTimeout(function(){_fetchThumb(canvas,app.pid,it,true)},500);delete canvas._wsTappedIdx;_drawWindowSwitcher(canvas);setTimeout(function(){delete canvas._wsLoading;_fetchAndDrawWindowSwitcher(canvas)},400)}).catch(function(){delete canvas._wsTappedIdx;_drawWindowSwitcher(canvas)});break}}}
// ── System Widgets (Window, Dock, Menu, Layout) ──

// ── Win Control 共用 ──
function _winCtrlPost(action){fetch("/api/system/window/arrange",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:action})}).catch(function(){})}
function _winCtrlXY(e,canvas){var rect=canvas.getBoundingClientRect();return{x:((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*(canvas.width/rect.width),y:((e.touches?e.touches[0].clientY:e.clientY)-rect.top)*(canvas.height/rect.height)}}
function _winIcon(ctx,dir,cx,cy,s,color,m){ctx.fillStyle=color;ctx.strokeStyle=color;if(dir==="center"){ctx.lineWidth=Math.max(1.4,m*0.012);_roundRect(ctx,cx-s*0.7,cy-s*0.7,s*1.4,s*1.4,s*0.22);ctx.stroke();return}ctx.beginPath();if(dir==="up"){ctx.moveTo(cx,cy-s);ctx.lineTo(cx-s,cy+s*0.65);ctx.lineTo(cx+s,cy+s*0.65)}else if(dir==="down"){ctx.moveTo(cx,cy+s);ctx.lineTo(cx-s,cy-s*0.65);ctx.lineTo(cx+s,cy-s*0.65)}else if(dir==="left"){ctx.moveTo(cx-s,cy);ctx.lineTo(cx+s*0.65,cy-s);ctx.lineTo(cx+s*0.65,cy+s)}else{ctx.moveTo(cx+s,cy);ctx.lineTo(cx-s*0.65,cy-s);ctx.lineTo(cx-s*0.65,cy+s)}ctx.closePath();ctx.fill()}

// ── Win Control 点击版(win-shortcuts):十字五方块,空隙不响应 ──
// 点方向块=贴左右顶底;点中心=铺满⇄恢复;长按中心=全屏;长按左右=全屏贴左右;上下无长按
function _winClickBtns(canvas){var w=canvas.width,h=canvas.height,gw=w/3,gh=h/3,pad=Math.min(gw,gh)*0.12;function R(r,c){return{x:c*gw+pad,y:r*gh+pad,w:gw-2*pad,h:gh-2*pad}}return[{zone:"top",r:R(0,1),dir:"up"},{zone:"left",r:R(1,0),dir:"left"},{zone:"center",r:R(1,1),dir:"center"},{zone:"right",r:R(1,2),dir:"right"},{zone:"bottom",r:R(2,1),dir:"down"}]}
function _winClickZone(canvas,tx,ty){var bs=_winClickBtns(canvas);for(var i=0;i<bs.length;i++){var r=bs[i].r;if(tx>=r.x&&tx<=r.x+r.w&&ty>=r.y&&ty<=r.y+r.h)return bs[i].zone}return null}
function _drawWinShortcuts(canvas,pressed){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,m=Math.min(w,h);ctx.clearRect(0,0,w,h);ctx.fillStyle=canvas._keyColor||"#1a2a2a";ctx.fillRect(0,0,w,h);var norm=canvas._winCtrlColor||"#cfd8dc",hi="#4ade80";_winClickBtns(canvas).forEach(function(b){var r=b.r,on=(pressed===b.zone),br=Math.min(r.w,r.h)*0.16;ctx.fillStyle=on?"rgba(74,222,128,0.28)":"rgba(255,255,255,0.08)";_roundRect(ctx,r.x,r.y,r.w,r.h,br);ctx.fill();ctx.strokeStyle=on?hi:"rgba(255,255,255,0.18)";ctx.lineWidth=Math.max(1,m*0.008);_roundRect(ctx,r.x,r.y,r.w,r.h,br);ctx.stroke();_winIcon(ctx,b.dir,r.x+r.w/2,r.y+r.h/2,Math.min(r.w,r.h)*0.28,on?hi:norm,m)})}
function _winClickAct(canvas,zone,isHold){if(zone==="center"){if(isHold){fetch("/api/system/window/fullscreen",{method:"POST"}).catch(function(){});return}var a=canvas._wcFilled?"restore":"fill";canvas._wcFilled=!canvas._wcFilled;_winCtrlPost(a);return}var map={left:isHold?"fs-left":"left",right:isHold?"fs-right":"right",top:"top",bottom:"bottom"};if(map[zone])_winCtrlPost(map[zone])}
function _onWinShortcutTouch(e,canvas){e.stopPropagation();var p=_winCtrlXY(e,canvas);var zone=_winClickZone(canvas,p.x,p.y);canvas._wcZone=zone;canvas._wcMoved=false;canvas._wcHoldFired=false;canvas._wcSX=p.x;canvas._wcSY=p.y;if(!zone)return;psnd(canvas._sound||"click");_drawWinShortcuts(canvas,zone);if(canvas._wcTimer)clearTimeout(canvas._wcTimer);if(zone==="center"||zone==="left"||zone==="right"){canvas._wcTimer=setTimeout(function(){canvas._wcHoldFired=true;_winClickAct(canvas,zone,true);_drawWinShortcuts(canvas,null)},500)}}
function _onWinShortcutMove(e,canvas){e.stopPropagation();if(!canvas._wcZone)return;var p=_winCtrlXY(e,canvas);var dx=p.x-canvas._wcSX,dy=p.y-canvas._wcSY;if(Math.sqrt(dx*dx+dy*dy)>12){canvas._wcMoved=true;if(canvas._wcTimer){clearTimeout(canvas._wcTimer);canvas._wcTimer=null}_drawWinShortcuts(canvas,null)}}
function _onWinShortcutEnd(e,canvas){e.stopPropagation();if(canvas._wcTimer){clearTimeout(canvas._wcTimer);canvas._wcTimer=null}_drawWinShortcuts(canvas,null);if(canvas._wcHoldFired||canvas._wcMoved||!canvas._wcZone)return;_winClickAct(canvas,canvas._wcZone,false)}

// ── Win Control 滑动版(win-gesture):单中心方块,点击=铺满⇄恢复/长按=全屏/左右滑=贴左右/上下滑=贴顶底 ──
// 方形摇杆:整块可按,摇杆头跟随手指;左右滑=贴左右/上下滑=贴顶底/轻点=铺满⇄恢复/长按=全屏
function _winSwipeGeom(canvas){var w=canvas.width,h=canvas.height,m=Math.min(w,h);return{cx:w/2,cy:h/2,R:m*0.40,knobR:m*0.17,maxR:m*0.30,m:m}}
function _drawWinSwipe(canvas,kx,ky,active){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height,g=_winSwipeGeom(canvas),cx=g.cx,cy=g.cy,norm=canvas._winCtrlColor||"#cfd8dc",hi="#4ade80";if(kx===undefined)kx=cx;if(ky===undefined)ky=cy;ctx.clearRect(0,0,w,h);ctx.fillStyle=canvas._keyColor||"#1a2a2a";ctx.fillRect(0,0,w,h);ctx.beginPath();ctx.arc(cx,cy,g.R,0,Math.PI*2);ctx.fillStyle="rgba(255,255,255,0.05)";ctx.fill();ctx.strokeStyle="rgba(255,255,255,0.18)";ctx.lineWidth=Math.max(1,g.m*0.008);ctx.beginPath();ctx.arc(cx,cy,g.R,0,Math.PI*2);ctx.stroke();var ar=g.R*0.80,as=g.m*0.05,pale=_hexToRgba(norm,0.5)||norm;_winIcon(ctx,"up",cx,cy-ar,as,pale,g.m);_winIcon(ctx,"down",cx,cy+ar,as,pale,g.m);_winIcon(ctx,"left",cx-ar,cy,as,pale,g.m);_winIcon(ctx,"right",cx+ar,cy,as,pale,g.m);ctx.beginPath();ctx.arc(kx,ky,g.knobR,0,Math.PI*2);ctx.fillStyle=active?(_hexToRgba(hi,0.30)||"rgba(74,222,128,0.30)"):"rgba(255,255,255,0.10)";ctx.fill();ctx.strokeStyle=active?hi:norm;ctx.lineWidth=Math.max(1.4,g.m*0.012);ctx.beginPath();ctx.arc(kx,ky,g.knobR,0,Math.PI*2);ctx.stroke()}
function _drawFullscreenBtn(canvas,bgColor,showIcon,showLabel,iconSize,fontSize){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle=bgColor||"#1a3a2a";ctx.fillRect(0,0,w,h);var cx=w/2,cy=h/2;if(showIcon===undefined)showIcon=true;if(showLabel===undefined)showLabel=true;if(showIcon&&showLabel){var m=Math.min(w,h),s=iconSize||Math.round(m*0.40);var iconCY=cy-s*0.18;var textCY=cy+s*0.52;var gap=s*0.16,lw=Math.max(1.2,s*0.09);ctx.strokeStyle="rgba(255,255,255,0.8)";ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(cx-s/2,iconCY-s/2+gap);ctx.lineTo(cx-s/2,iconCY-s/2);ctx.lineTo(cx-s/2+gap,iconCY-s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+s/2,iconCY+s/2-gap);ctx.lineTo(cx+s/2,iconCY+s/2);ctx.lineTo(cx+s/2-gap,iconCY+s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+s/2,iconCY-s/2+gap);ctx.lineTo(cx+s/2,iconCY-s/2);ctx.lineTo(cx+s/2-gap,iconCY-s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-s/2,iconCY+s/2-gap);ctx.lineTo(cx-s/2,iconCY+s/2);ctx.lineTo(cx-s/2+gap,iconCY+s/2);ctx.stroke();ctx.fillStyle="rgba(255,255,255,0.75)";var tf=fontSize||Math.max(8,Math.round(Math.min(h*0.17,w*0.09)));ctx.font="bold "+tf+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Fullscreen",cx,textCY)}else if(showIcon){var s=iconSize||Math.round(Math.min(w,h)*0.50),gap=s*0.16,lw=Math.max(1.2,s*0.10);ctx.strokeStyle="rgba(255,255,255,0.85)";ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(cx-s/2,cy-s/2+gap);ctx.lineTo(cx-s/2,cy-s/2);ctx.lineTo(cx-s/2+gap,cy-s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+s/2,cy+s/2-gap);ctx.lineTo(cx+s/2,cy+s/2);ctx.lineTo(cx+s/2-gap,cy+s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+s/2,cy-s/2+gap);ctx.lineTo(cx+s/2,cy-s/2);ctx.lineTo(cx+s/2-gap,cy-s/2);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-s/2,cy+s/2-gap);ctx.lineTo(cx-s/2,cy+s/2);ctx.lineTo(cx-s/2+gap,cy+s/2);ctx.stroke()}else{ctx.fillStyle="rgba(255,255,255,0.85)";var tf=fontSize||Math.max(10,Math.round(Math.min(h*0.40,w*0.16)));ctx.font="bold "+tf+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Fullscreen",cx,cy)}}
function _drawSwitchProfileBtn(canvas,bgColor,iconColor,label,showIcon,showLabel,iconSize,fontSize){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle=bgColor||"#2a1a3a";ctx.fillRect(0,0,w,h);var cx=w/2,cy=h/2;if(showIcon===undefined)showIcon=true;if(showLabel===undefined)showLabel=true;var ic=iconColor||"#a78bfa";if(showIcon&&showLabel){var iconCY=cy-Math.min(h,w)*0.12;var textCY=cy+Math.min(h,w)*0.30;var as=iconSize||Math.round(Math.min(w*0.35,h*0.32));ctx.fillStyle=ic;ctx.font="bold "+as+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("⇄",cx,iconCY);ctx.fillStyle=ic;var tf=fontSize||Math.max(8,Math.round(Math.min(h*0.18,w*0.09)));ctx.font=tf+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label||"None",cx,textCY)}else if(showIcon){var as=iconSize||Math.round(Math.min(w*0.55,h*0.50));ctx.fillStyle=ic;ctx.font="bold "+as+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("⇄",cx,cy)}else{ctx.fillStyle=ic;var tf=fontSize||Math.max(10,Math.round(Math.min(h*0.35,w*0.15)));ctx.font=tf+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(label||"None",cx,cy)}}
function _drawTextMacroBtn(canvas,bgColor,text,fontColor,fontSize,fontFamily){var ctx=canvas.getContext("2d"),w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle=bgColor||"#1a2a1a";ctx.fillRect(0,0,w,h);var fc=fontColor||"#e8e0d8",fs=fontSize||13,ff=fontFamily||"monospace";var padX=Math.max(6,w*0.05);var hdrFs=Math.max(8,fs*0.55);var topPad=Math.max(5,h*0.10);ctx.fillStyle="rgba(255,255,255,0.3)";ctx.font=hdrFs+"px -apple-system,sans-serif";ctx.textAlign="left";ctx.textBaseline="top";ctx.fillText("TEXT MACRO",padX,topPad);var textTop=topPad+hdrFs+Math.max(2,h*0.05),textH=h-textTop-topPad;if(text&&text.length>0){var display=text;ctx.fillStyle=fc;ctx.font=fs+"px "+ff;ctx.textAlign="left";ctx.textBaseline="middle";var maxW=w-padX*2,lineH=fs*1.35,maxLines=Math.floor(textH/lineH);var lines=[];if(display.indexOf("\n")>=0){var raw=display.split("\n");for(var i=0;i<Math.min(raw.length,maxLines);i++){var ln=raw[i];if(ctx.measureText(ln).width>maxW){while(ln.length>1&&ctx.measureText(ln+"…").width>maxW)ln=ln.slice(0,-1);ln+="…"}lines.push(ln)}}else{var ln=display;if(ctx.measureText(ln).width>maxW){while(ln.length>1&&ctx.measureText(ln+"…").width>maxW)ln=ln.slice(0,-1);ln+="…"}lines.push(ln)}var startY=textTop+textH/2-(lines.length*lineH)/2+lineH*0.3;for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],padX,startY+i*lineH)}}else{ctx.fillStyle="rgba(255,255,255,0.2)";ctx.font=fs+"px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("(empty)",w/2,textTop+textH/2)}}function _onWinSwipeTouch(e,canvas){e.stopPropagation();var p=_winCtrlXY(e,canvas),g=_winSwipeGeom(canvas);canvas._wsActive=true;canvas._wsSX=p.x;canvas._wsSY=p.y;canvas._wsDX=0;canvas._wsDY=0;canvas._wsHold=false;_drawWinSwipe(canvas,g.cx,g.cy,true);if(canvas._wsTimer)clearTimeout(canvas._wsTimer);canvas._wsTimer=setTimeout(function(){canvas._wsHold=true;psnd(canvas._sound||"click");fetch("/api/system/window/fullscreen",{method:"POST"}).catch(function(){});_drawWinSwipe(canvas,g.cx,g.cy,false)},500)}
function _onWinSwipeMove(e,canvas){e.stopPropagation();if(!canvas._wsActive)return;var p=_winCtrlXY(e,canvas),g=_winSwipeGeom(canvas),dx=p.x-canvas._wsSX,dy=p.y-canvas._wsSY;canvas._wsDX=dx;canvas._wsDY=dy;var d=Math.sqrt(dx*dx+dy*dy),kx,ky;if(d>g.maxR&&d>0){kx=g.cx+dx/d*g.maxR;ky=g.cy+dy/d*g.maxR}else{kx=g.cx+dx;ky=g.cy+dy}if(d>12&&canvas._wsTimer){clearTimeout(canvas._wsTimer);canvas._wsTimer=null}_drawWinSwipe(canvas,kx,ky,true)}
function _onWinSwipeEnd(e,canvas){e.stopPropagation();if(!canvas._wsActive)return;canvas._wsActive=false;if(canvas._wsTimer){clearTimeout(canvas._wsTimer);canvas._wsTimer=null}var g=_winSwipeGeom(canvas);_drawWinSwipe(canvas,g.cx,g.cy,false);if(canvas._wsHold)return;var dx=canvas._wsDX||0,dy=canvas._wsDY||0,dist=Math.sqrt(dx*dx+dy*dy),SW=g.m*0.18;psnd(canvas._sound||"click");if(dist>SW){var a=Math.abs(dx)>Math.abs(dy)?(dx<0?"left":"right"):(dy<0?"top":"bottom");_winCtrlPost(a)}else{var f=canvas._wcFilled?"restore":"fill";canvas._wcFilled=!canvas._wcFilled;_winCtrlPost(f)}}

// ── Dock Panel — horizontal, icons, transparent, scroll ──

function _drawDockGrid(canvas, apps) {
  var ctx = canvas.getContext("2d"), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!apps || !apps.length) return;
  var iconSize = Math.max(40, Math.min(56, h * 0.65));
  var gap = 6, itemW = iconSize + gap * 2;
  canvas._dockApps = apps; canvas._dockItemW = itemW; canvas._dockIconSize = iconSize;
  canvas._dockMaxScroll = Math.max(0, apps.length * itemW - w);
  if (!canvas._dockScroll) canvas._dockScroll = 0;
  if (canvas._dockScroll > canvas._dockMaxScroll) canvas._dockScroll = canvas._dockMaxScroll;
  var scrollX = canvas._dockScroll;
  var fs = Math.max(7, Math.min(iconSize * 0.17, w * 0.025));
  ctx.font = fs + "px -apple-system,sans-serif";
  ctx.textAlign = "center";
  for (var i = 0; i < apps.length; i++) {
    var x = i * itemW - scrollX + gap;
    if (x + iconSize < -10 || x > w + 10) continue;
    var a = apps[i];
    var iconY = (h - iconSize - fs - 6) / 2;
    // Pressed state highlight
    var pressed = (_dockPressedIdx === i);
    var pending = (_dockPending && _dockPending.name === a.name);
    if (pressed) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x - 3, iconY - 5, iconSize + 6, iconSize + 18);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, iconY - 5, iconSize + 6, iconSize + 18);
    }
    if (a.running || pending) {
      var alpha = 1;
      if (pending) {
        // Gradual sin-wave blink: ~300ms cycle
        var wave = Math.sin(Date.now() / 150);
        if (_dockPending.action === "launch") {
          // Off→On: blink between dim and bright
          alpha = 0.2 + 0.8 * (wave * 0.5 + 0.5);
        } else {
          // On→Off: blink between bright and dim
          alpha = 0.2 + 0.8 * (1 - (wave * 0.5 + 0.5));
        }
      }
      if (a.running || pending) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = "#4ade80";
        ctx.beginPath(); ctx.arc(x + iconSize/2, iconY - 4, 4, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    if (!canvas._dockIcons) canvas._dockIcons = {};
    var img = canvas._dockIcons[a.name];
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      if (pressed) { ctx.translate(x + iconSize/2, iconY + iconSize/2); ctx.scale(1.1, 1.1); ctx.translate(-(x + iconSize/2), -(iconY + iconSize/2)); }
      ctx.drawImage(img, x, iconY, iconSize, iconSize);
      ctx.restore();
    } else {
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(x, iconY, iconSize, iconSize);
      var initFs = Math.max(16, iconSize * 0.45);
      ctx.font = "bold " + initFs + "px -apple-system,sans-serif";
      ctx.fillStyle = "#888"; ctx.textBaseline = "middle";
      ctx.fillText(a.name.charAt(0).toUpperCase(), x + iconSize/2, iconY + iconSize/2);
      if (!canvas._dockIcons[a.name]) {
        var img2 = new Image();
        var capName = a.name;
        img2.onload = function(n) { return function() { canvas._dockIcons[n] = this; _drawDockGrid(canvas, canvas._dockApps); }; }(capName);
        img2.onerror = function() { canvas._dockIcons[capName] = {complete:true, naturalWidth:0}; setTimeout(function(){ if(canvas._dockIcons[capName] && !canvas._dockIcons[capName].naturalWidth) delete canvas._dockIcons[capName]; }, 5000); };
        img2.src = "/api/system/app-icon?name=" + encodeURIComponent(a.bundle || a.name || "");
        canvas._dockIcons[a.name] = img2;
      }
    }
    ctx.fillStyle = "#ccc"; ctx.font = fs + "px -apple-system,sans-serif";
    ctx.textBaseline = "top";
    var label = a.name.length > 8 ? a.name.substring(0,7)+".." : a.name;
    ctx.fillText(label, x + iconSize/2, iconY + iconSize + 2);
  }
}

var _dockTX = 0, _dockTS = 0, _dockTMoved = false, _dockPressedIdx = -1, _dockTStart = 0, _dockPending = null;
function _onDockTouchStart(e, canvas) {
  e.preventDefault(); e.stopPropagation();
  touchUsed = true;
  var t = e.touches ? e.touches[0] : e;
  _dockTX = t.clientX; _dockTS = canvas._dockScroll || 0; _dockTMoved = false; _dockTStart = Date.now();
  // Detect which icon was pressed
  var rect = canvas.getBoundingClientRect();
  var cx = (t.clientX - rect.left) * (canvas.width / rect.width);
  _dockPressedIdx = Math.floor((cx + (canvas._dockScroll||0)) / (canvas._dockItemW||68));
  if (canvas._dockApps && (_dockPressedIdx < 0 || _dockPressedIdx >= canvas._dockApps.length)) _dockPressedIdx = -1;
  if (_dockPressedIdx >= 0) _drawDockGrid(canvas, canvas._dockApps);
  // rAF poll: check elapsed time every frame while holding
  var _cv2 = canvas, _pi2 = _dockPressedIdx;
  function _pollLP() {
    if (_dockTMoved || _dockPressedIdx !== _pi2) return;
    if (Date.now() - _dockTStart >= 600) {
      var app = _cv2._dockApps && _cv2._dockApps[_pi2];
      if (app) {
        var quitSnd = (_cv2._dockKey && _cv2._dockKey.quitSound) || "quit";
        if (typeof psnd === "function") psnd(quitSnd);
        fetch("/api/system/quit-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: app.bundle || app.name, path: app.path})}).catch(function(){});
        _dockPressedIdx = -1; _dockPending = {name: app.name, action: "quit"};
        if (_cv2._dockApps) _drawDockGrid(_cv2, _cv2._dockApps);
      }
      return;
    }
    requestAnimationFrame(_pollLP);
  }
  requestAnimationFrame(_pollLP);
}
function _onDockTouchMove(e, canvas) {
  e.stopPropagation();
  if (!canvas._dockMaxScroll) return;
  var t = e.touches ? e.touches[0] : e;
  var dx = _dockTX - t.clientX;
  if (Math.abs(dx) > 8) { _dockTMoved = true; _dockPressedIdx = -1; }
  canvas._dockScroll = Math.max(0, Math.min(canvas._dockMaxScroll, _dockTS + dx));
  _drawDockGrid(canvas, canvas._dockApps);
}
function _onDockTouchEnd(e, canvas) {
  e.stopPropagation();
  var pressedIdx = _dockPressedIdx;
  _dockPressedIdx = -1;
  if (_dockTMoved || pressedIdx < 0) { _drawDockGrid(canvas, canvas._dockApps); return; }
  // Clear highlight
  _drawDockGrid(canvas, canvas._dockApps);
  var t = e.touches ? e.changedTouches[0] : e;
  var rect = canvas.getBoundingClientRect();
  var x = (t.clientX - rect.left) * (canvas.width / rect.width);
  var idx = Math.floor((x + (canvas._dockScroll||0)) / (canvas._dockItemW||68));
  if (canvas._dockApps && idx >= 0 && idx < canvas._dockApps.length) {
    var a = canvas._dockApps[idx];
    var elapsed = (Date.now()) - _dockTStart;
    if (elapsed >= 600) {
      // Long press — quit app
      var quitSnd = (canvas._dockKey && canvas._dockKey.quitSound) || "quit";
      if (typeof psnd === "function") psnd(quitSnd);
      _dockPending = {name: a.name, action: "quit"}; _drawDockGrid(canvas, canvas._dockApps); fetch("/api/system/quit-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name: a.bundle || a.name, path: a.path})}).catch(function(){});
    } else {
      // Short tap — launch app
      var snd = (canvas._dockKey && canvas._dockKey.sound) || (profile && profile.defaultSound) || "click";
      if (typeof psnd === "function") psnd(snd);
      _dockPending = {name: a.name, action: "launch"}; _drawDockGrid(canvas, canvas._dockApps); fetch("/api/system/launch-app", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({path: a.path, name: a.name})}).catch(function(){});
    }
  }
}
function _fetchAndDrawDock(canvas) {
  // Clear any existing timer on this canvas
  if (canvas._dockTimer) { clearTimeout(canvas._dockTimer); canvas._dockTimer = null; }
  function _doFetch() {
    fetch("/api/system/dock-items").then(function(r){return r.json()}).then(function(d){
      if (d && d.length > 0) { if (!canvas._dockIcons) canvas._dockIcons = {}; if (_dockPending) { var _p = d.find(function(x){return x.name === _dockPending.name}); if (!_p || (_dockPending.action === "launch" && _p.running) || (_dockPending.action === "quit" && !_p.running)) _dockPending = null; } _drawDockGrid(canvas, d); }
    }).catch(function(e){ console.log("dock err:",e); })
    .finally(function(){ canvas._dockTimer = setTimeout(_doFetch, 2000); });
  }
  _doFetch();
}
