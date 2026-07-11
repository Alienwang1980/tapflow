// ── Props ──
function rpr(){var has=!!(selKey||selKeys.size>0);document.getElementById("rp-library").style.display=has?"none":"block";document.getElementById("rp-props").style.display=has?"block":"none";_updateClipboardPanel();var _gb=document.getElementById("btnSaveGroup");if(_gb){_gb.style.opacity=selKeys.size>1?"1":"0.4";_gb.style.pointerEvents=selKeys.size>1?"auto":"none"}
  if(selKeys.size>1){
    var pg2=cp_(),firstBr2=10,commonColor="#0f3460",colorCount=0,clrs=new Set(),fcSet=new Set(),ffSet=new Set(),commonFontColor="inherit",commonFontFamily="",commonFontSize=10,fsSet=new Set(),sndSet=new Set(),commonSound="";
    for(var i=0;i<pg2.keys.length;i++){if(selKeys.has(pg2.keys[i].id)){var k2=pg2.keys[i];if(firstBr2===10)firstBr2=k2.borderRadius!==undefined?k2.borderRadius:10;var cc=k2.color||"#0f3460";commonColor=cc;clrs.add(cc);var fc2=k2.fontColor||"inherit";commonFontColor=fc2;fcSet.add(fc2);var ff2=k2.fontFamily||"";commonFontFamily=ff2;ffSet.add(ff2);var fs2=k2.fontSize||Math.max(8,(profile?.cellSize||60)*0.25);commonFontSize=fs2;fsSet.add(fs2);var snd2=k2.sound||"";commonSound=snd2;sndSet.add(snd2)}}var sndCount=sndSet.size;if(sndSet.size===1)commonSound=[...sndSet][0];colorCount=clrs.size;if(clrs.size===1)commonColor=[...clrs][0];
var sndOpts="";var _sounds=[["","Inherit"],["none","None"],["click","Click"],["soft","Soft"],["mechanical","Mechanical"],["deep","Deep"],["red","Red Switch"],["topre","Topre EC"],["glass","Glass Tap"],["bubble","Bubble Pop"],["blip","8-bit Blip"],["spark","Electric Spark"]];for(var _si=0;_si<_sounds.length;_si++){var _sv=_sounds[_si][0],_sl=_sounds[_si][1];sndOpts+="<option value=\""+_sv+"\""+(sndCount===1&&commonSound===_sv?" selected":"")+">"+_sl+"</option>"}
    document.getElementById("pc").innerHTML=
      "<p style=\"font-size:11px;color:var(--dim);margin-bottom:6px\">"+selKeys.size+" keys selected</p>"+
      "<label>Label <small style=\"color:var(--dim)\">(inactive)</small></label><input disabled style=\"opacity:0.4;width:100%;padding:4px 6px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px\">"+
      "<label>Action (all)</label><select onchange=\"upkGroup('action',this.value)\"><option value=\"hold\">Hold (long press)</option></select>"+
      "<label>Color (all)</label>"+
      (colorCount>1?"<button data-cp=\"grpColor\" onclick=\"showCP(\'grpColor\',\'#0f3460\')\" style=\"display:inline-block;width:26px;height:26px;background:linear-gradient(90deg,red,orange,yellow,green,blue,violet);border:1px solid rgba(255,255,255,0.3);border-radius:3px;cursor:pointer;vertical-align:middle\" title=\"Multiple colors\"></button>":"<button data-cp=\"grpColor\" onclick=\"showCP(\'grpColor\',\'"+commonColor+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:\'+commonColor+\'\"></button>")+
      "<label>&#x24D0; Font Color</label>"+
      (fcSet.size>1?"<button data-cp=\"grpFontColor\" onclick=\"showCP(\'grpFontColor\',\'#ffffff\')\" style=\"display:inline-block;width:26px;height:26px;background:linear-gradient(90deg,red,orange,yellow,green,blue,violet);border:1px solid rgba(255,255,255,0.3);border-radius:3px;cursor:pointer;vertical-align:middle\"></button>":"<button data-cp=\"grpFontColor\" onclick=\"showCP(\'grpFontColor\',\'"+commonFontColor+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:\'+commonFontColor+\'\"></button>")+
      "<label>&#x210D; Font</label>"+
      (ffSet.size>1?"<span style=\"font-size:10px;color:var(--dim);padding:4px 6px\">Multiple</span><select onchange=\"upkGroup('fontFamily',this.value)\"><option value=\"\">System</option><option value=\"monospace\">Mono</option><option value=\"serif\">Serif</option><option value=\"sans-serif\">Sans</option><option value=\"Press Start 2P\">Pixel (8bit)</option><option value=\"VT323\">Pixel (VT323)</option><option value=\"Russo One\">Bold</option></select>":"<select onchange=\"upkGroup('fontFamily',this.value)\"><option value=\"\""+(!commonFontFamily?" selected":"")+">System</option><option value=\"monospace\""+(commonFontFamily==="monospace"?" selected":"")+">Mono</option><option value=\"serif\""+(commonFontFamily==="serif"?" selected":"")+">Serif</option><option value=\"sans-serif\""+(commonFontFamily==="sans-serif"?" selected":"")+">Sans</option><option value=\"Press Start 2P\""+(commonFontFamily==="Press Start 2P"?" selected":"")+">Pixel (8bit)</option><option value=\"VT323\""+(commonFontFamily==="VT323"?" selected":"")+">Pixel (VT323)</option><option value=\"Russo One\""+(commonFontFamily==="Russo One"?" selected":"")+">Bold</option></select>")+
      "<label>&#x21C5; Font Size</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"var n=this.nextElementSibling;var v=parseInt(n.value)||10;v=Math.max(6,v-2);n.value=v;upkGroupStepSzVal(v)\">\u2212</button><input type=\"number\" value="+commonFontSize+" onchange=\"upkGroupStepSzVal(parseInt(this.value))\" style=\"width:40px;text-align:center;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px;padding:2px 4px\"><button onclick=\"var n=this.previousElementSibling;var v=parseInt(n.value)||10;v=Math.min(48,v+2);n.value=v;upkGroupStepSzVal(v)\">+</button></div>"+
      "<label>Sound (all)</label><select onchange=\"upkGroup('sound',this.value)\">"+sndOpts+"</select>"+
      "<label>Border (all)</label><div style=\"display:flex;gap:4px;align-items:center\"><input type=range min=0 max=50 value="+firstBr2+" oninput=\"this.nextElementSibling.value=this.value\" onchange=\"upkGroup('borderRadius',parseInt(this.value))\" style=\"flex:1\"><input type=number min=0 max=50 value="+firstBr2+" onchange=\"this.previousElementSibling.value=this.value;upkGroup('borderRadius',parseInt(this.value))\" style=\"width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center\"></div>"+
      "<label>Width (all) \u00b10.25</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"upkGroupStep('w',-0.25)\">\u2212</button><span>0.25</span><button onclick=\"upkGroupStep('w',0.25)\">+</button></div>"+
      "<label>Height (all) \u00b10.25</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"upkGroupStep('h',-0.25)\">\u2212</button><span>0.25</span><button onclick=\"upkGroupStep('h',0.25)\">+</button></div>"+
      "<div class=\"br\" style=\"margin-top:4px\"><button class=\"btn-del\" onclick=\"delSelected()\">Delete Selected</button></div>";var _ss2=document.querySelectorAll("#pc select");for(var _i2=0;_i2<_ss2.length;_i2++){var _s2=_ss2[_i2];var _oc2=_s2.getAttribute("onchange")||"";if(_oc2.toLowerCase().indexOf("sound")<0)continue;var _b2=document.createElement("button");_b2.className="pv-btn";_b2.innerHTML="&#x25B6;";_b2.style.cssText="padding:4px 8px;font-size:12px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;margin-left:4px";_b2.onmouseover=function(){this.style.borderColor="var(--accent)"};_b2.onmouseout=function(){this.style.borderColor="var(--border)"};_b2.onclick=function(s){return function(e){e.preventDefault();e.stopPropagation();var v=s.value;if(!v||v===""){v=document.getElementById("tgs").value}if(v&&v!=="")testSnd(v)}}(_s2);_s2.parentNode.insertBefore(_b2,_s2.nextSibling)}
    return;
  }
  const key=selKey?cp_()?.keys.find(k=>k.id===selKey):null;
  if(key&&key.action==="visualizer"){document.getElementById("pc").innerHTML="<div style=\"margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)\">"+"<label style=\"color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px\">Audio Visualizer</label>"+"<p style=\"font-size:10px;color:var(--dim);margin:4px 0\">Uses iPad microphone</p>"+"</div>"+"<label>Label</label><input value=\""+hesc(key.label)+"\" onchange=\"upk('label',this.value)\">"+"<label>&#x25A3; Border</label><div style=\"margin:2px 0;display:flex;gap:4px;align-items:center\"><input type=range min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" oninput=\"this.nextElementSibling.value=this.value\" onchange=\"upk(\'borderRadius\',parseInt(this.value))\" style=\"flex:1\"><input type=number min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" onchange=\"this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))\" style=\"width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center\"></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";return;}if(key&&key.action==="balance"){document.getElementById("pc").innerHTML="<div style=\"margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)\">"+"<label style=\"color:#f59e0b;font-size:10px;text-transform:uppercase;letter-spacing:1px\">Deepseek Balance</label>"+"<p style=\"font-size:10px;color:var(--dim);margin:4px 0\">API credit remaining</p>"+"</div>"+"<label>Label</label><input value=\""+hesc(key.label)+"\" onchange=\"upk('label',this.value)\">"+"<label>API Key</label><input value=\""+hesc(key.apiKey||"")+"\" placeholder=\"sk-...\" onchange=\"upk('apiKey',this.value)\">"+"<label>Color</label><button data-cp=\"color\" onclick=\"showCP(\'color\',\'"+(key.color||"#0d1117")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.color||"#0d1117")+"\"></button>"+"<div style=\"margin-top:10px;padding-top:8px;border-top:1px solid var(--border)\">"+"<label style=\"font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block\">Show Fields</label>"+"<div style=\"display:flex;flex-direction:column;gap:4px\">"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upkShowFlag('total',this.checked)\" style=\"width:16px;height:16px\" "+(key.showFlags&&key.showFlags.total===false?"":"checked")+"><span>Total Balance</span></label>"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upkShowFlag('topped',this.checked)\" style=\"width:16px;height:16px\" "+(key.showFlags&&key.showFlags.topped===false?"":"checked")+"><span>Topped up</span></label>"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upkShowFlag('granted',this.checked)\" style=\"width:16px;height:16px\" "+(key.showFlags&&key.showFlags.granted===false?"":"checked")+"><span>Granted</span></label></div></div>"+"<label>&#x25A3; Border</label><div style=\"margin:2px 0;display:flex;gap:4px;align-items:center\"><input type=range min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" oninput=\"this.nextElementSibling.value=this.value\" onchange=\"upk(\'borderRadius\',parseInt(this.value))\" style=\"flex:1\"><input type=number min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" onchange=\"this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))\" style=\"width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center\"></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";return;}if(key&&key.action==="touchpad"){document.getElementById("pc").innerHTML="<div style=\"margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)\">"+"<label style=\"color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px\">Touch Pad</label>"+"<p style=\"font-size:10px;color:var(--dim);margin:4px 0\">1 finger = move | 2 fingers = scroll</p>"+"</div>"+"<label>&#x25C6; Label</label><input data-fn=\"'+p.filename+'\" value=\""+hesc(key.label)+"\" onchange=\"upk('label',this.value)\">"+"<label>&#x25CF; Color</label><button data-cp=\"color\" onclick=\"showCP(\'color\',\'"+(key.color||"#2a3a5a")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.color||"#2a3a5a")+"\"></button>"+"<label>&#x24D0; Font Color</label><button data-cp=\"fontColor\" onclick=\"showCP(\'fontColor\',\'"+(key.fontColor||"#ffffff")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.fontColor||"#ffffff")+"\"></button>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk('w',"+_snap4((key.w||4)-0.25)+")\">\u2212</button><span>"+(key.w||4).toFixed(2)+"</span><button onclick=\"upk('w',"+_snap4((key.w||4)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk('h',"+_snap4((key.h||3)-0.25)+")\">\u2212</button><span>"+(key.h||3).toFixed(2)+"</span><button onclick=\"upk('h',"+_snap4((key.h||3)+0.25)+")\">+</button></div></div></div>"+"<label>&#x25A3; Border</label><div style=\"margin:2px 0;display:flex;gap:4px;align-items:center\"><input type=range min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" oninput=\"this.nextElementSibling.value=this.value\" onchange=\"upk(\'borderRadius\',parseInt(this.value))\" style=\"flex:1\"><input type=number min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" onchange=\"this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))\" style=\"width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center\"></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";return;}if(key&&key.action==="dock"){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px">Dock Panel</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Tap to launch, hold to quit</p></div>'+
'<label>&#x25A3; Border Radius</label><div style="margin:2px 0;display:flex;gap:4px;align-items:center"><input type=range min=0 max=50 value="'+(key.borderRadius!==undefined?key.borderRadius:10)+'" oninput="this.nextElementSibling.value=this.value" onchange="upk(\'borderRadius\',parseInt(this.value))" style="flex:1"><input type=number min=0 max=50 value="'+(key.borderRadius!==undefined?key.borderRadius:10)+'" onchange="this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+
'<label>&#x25CF; Bg Color</label><button data-cp="bgColor" onclick="showCP(\'bgColor\',\''+(key.bgColor||key.color||"#1a1a2e")+'\')" style="width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:'+(key.bgColor||key.color||"#1a1a2e")+'"></button>'+
'<label>&#x25D1; Bg Opacity</label><div style="margin:2px 0;display:flex;gap:4px;align-items:center"><input type=range min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:0.15)*100)+'" oninput="this.nextElementSibling.value=this.value" onchange="upk(\'bgOpacity\',parseInt(this.value)/100)"><input type=number min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:0.15)*100)+'" onchange="this.previousElementSibling.value=this.value;upk(\'bgOpacity\',parseInt(this.value)/100)" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+
'<label>&#x266B; Sound</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'">Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'">None</option><option value="click"'+(key.sound==="click"?" selected":"")+'">Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'">Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'">Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'">Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'">Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'">Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'">Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'">Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'">8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'">Electric Spark</option></select>'+
'<label>&#x266B; Quit Sound</label><select onchange="upk(\'quitSound\',this.value)"><option value=""'+(!key.quitSound?" selected":"")+'">Inherit</option><option value="none"'+(key.quitSound==="none"?" selected":"")+'">None</option><option value="click"'+(key.quitSound==="click"?" selected":"")+'">Click</option><option value="soft"'+(key.quitSound==="soft"?" selected":"")+'">Soft</option><option value="mechanical"'+(key.quitSound==="mechanical"?" selected":"")+'">Mechanical</option><option value="deep"'+(key.quitSound==="deep"?" selected":"")+'">Deep</option><option value="red"'+(key.quitSound==="red"?" selected":"")+'">Red Switch</option><option value="topre"'+(key.quitSound==="topre"?" selected":"")+'">Topre EC</option><option value="glass"'+(key.quitSound==="glass"?" selected":"")+'">Glass Tap</option><option value="bubble"'+(key.quitSound==="bubble"?" selected":"")+'">Bubble Pop</option><option value="blip"'+(key.quitSound==="blip"?" selected":"")+'">8-bit Blip</option><option value="spark"'+(key.quitSound==="spark"?" selected":"")+'">Electric Spark</option><option value="quit"'+(key.quitSound==="quit"?" selected":"")+'">Quit (Saw)</option></select>'+
'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4((key.w||4)-0.25)+')">−</button><span>'+(key.w||4).toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4((key.w||4)+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4((key.h||1.5)-0.25)+')">−</button><span>'+(key.h||1.5).toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4((key.h||1.5)+0.25)+')">+</button></div></div></div>'+
'<div class="br"><button class="btn-del" onclick="dkey()">Delete</button></div>';return;}if(key&&key.action==="mic-mute"){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px">Mic Mute</label></div>'+"<label>&#x25C6; Label</label><input value=\""+hesc(key.label)+"\" onchange=\"upk(\'label\',this.value)\">"+"<label>&#x25CF; Button Bg</label><button data-cp=\"color\" onclick=\"showCP(\'color\',\'"+(key.color||"#1a2a2a")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.color||"#1a2a2a")+"\"></button>"+"<label>&#x25CF; Icon & Circle</label><button data-cp=\"micColor\" onclick=\"showCP(\'micColor\',\'"+(key.micColor||"#999999")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.micColor||"#999999")+"\"></button>"+"<label>&#x25CF; Level Color</label><button data-cp=\"micLevelColor\" onclick=\"showCP(\'micLevelColor\',\'"+(key.micLevelColor||"#4ade80")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.micLevelColor||"#4ade80")+"\"></button>"+"<label>&#x25A3; Border</label><div style=\"margin:2px 0;display:flex;gap:4px;align-items:center\"><input type=range min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" oninput=\"this.nextElementSibling.value=this.value\" onchange=\"upk(\'borderRadius\',parseInt(this.value))\" style=\"flex:1\"><input type=number min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" onchange=\"this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))\" style=\"width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center\"></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";return;}if(key&&key.action==="volume"){var _lo2=key.layout||"horizontal";document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px">Volume Slider</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Slide on surface to adjust</p></div>'+"<label>&#x25C6; Label</label><input value=\""+hesc(key.label)+"\" onchange=\"upk(\'label\',this.value)\">"+"<label>&#x260E; Layout</label><select onchange=\"upk(\'layout\',this.value)\"><option value=\"horizontal\""+(_lo2==="horizontal"?" selected":"")+">Horizontal</option><option value=\"vertical\""+(_lo2==="vertical"?" selected":"")+">Vertical</option></select>"+"<label>&#x25CF; Color</label><button data-cp=\"color\" onclick=\"showCP(\'color\',\'"+(key.color||"#1a2a1a")+"\')\" style=\"width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:"+(key.color||"#1a2a1a")+"\"></button>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk(\'w\',"+_snap4((key.w||3)-0.25)+")\">−</button><span>"+(key.w||3).toFixed(2)+"</span><button onclick=\"upk(\'w\',"+_snap4((key.w||3)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk(\'h\',"+_snap4((key.h||1)-0.25)+")\">−</button><span>"+(key.h||1).toFixed(2)+"</span><button onclick=\"upk(\'h\',"+_snap4((key.h||1)+0.25)+")\">+</button></div></div></div>"+"<label>&#x25A3; Border</label><div style=\"margin:2px 0;display:flex;gap:4px;align-items:center\"><input type=range min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" oninput=\"this.nextElementSibling.value=this.value\" onchange=\"upk(\'borderRadius\',parseInt(this.value))\" style=\"flex:1\"><input type=number min=0 max=50 value=\""+(key.borderRadius!==undefined?key.borderRadius:10)+"\" onchange=\"this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))\" style=\"width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center\"></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";return;}
  if(!key){document.getElementById("pc").innerHTML='<p style="font-size:11px;color:var(--dim)">Click key to edit</p>';return}
  const kw=key.w||1,kh=key.h||1;
  document.getElementById("pc").innerHTML=
    '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">'+
    '<label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Function</label>'+
    '<label>&#x25C6; Label</label><input value="'+hesc(key.label)+'" onchange="upk(\'label\',this.value)">'+
    '<label>&#x2699; Action</label><select onchange="upk(\'action\',this.value)"><option value="hold"'+(key.action==="hold"||key.action==="key"?" selected":"")+'>Hold (long press)</option></select>'+
    '<button onclick="openMM(' + "'" + selKey + "'" + ')" style="width:100%;padding:5px;margin-top:4px;font-size:11px;cursor:pointer;background:rgba(233,69,96,0.2);color:var(--accent);border:1px solid var(--accent);border-radius:3px">Assign Key / Macro</button>'+
    '</div>'+
    '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">'+
    '<label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Style</label>'+
    '<div style="margin:2px 0;display:flex;gap:4px;align-items:center"><label>&#x25A3; Border</label><input type=range min=0 max=50 value="'+(key.borderRadius!==undefined?key.borderRadius:10)+'" oninput="this.nextElementSibling.value=this.value" onchange="upk(\'borderRadius\',parseInt(this.value))" style="flex:1"><input type=number min=0 max=50 value="'+(key.borderRadius!==undefined?key.borderRadius:10)+'" onchange="this.previousElementSibling.value=this.value;upk(\'borderRadius\',parseInt(this.value))" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+
    '<label>&#x25CF; Color</label><button data-cp="color" onclick="showCP(\'color\',\''+(key.color||"#0f3460")+'\')" style="width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:'+(key.color||"#0f3460")+'"></button>'+
    '<label>&#x24D0; Font Color</label><button data-cp="fontColor" onclick="showCP(\'fontColor\',\''+(key.fontColor||"#ffffff")+'\')" style="width:28px;height:22px;border-radius:3px;border:1px solid var(--border);cursor:pointer;background:'+(key.fontColor||"#ffffff")+'"></button>'+
    '<label>&#x210D; Font</label><select onchange="upk(\'fontFamily\',this.value)"><option value=""'+(!key.fontFamily?" selected":"")+'>System</option><option value="monospace"'+(key.fontFamily==="monospace"?" selected":"")+'>Monospace</option><option value="serif"'+(key.fontFamily==="serif"?" selected":"")+'>Serif</option><option value="sans-serif"'+(key.fontFamily==="sans-serif"?" selected":"")+'>Sans</option><option value="Courier New"'+(key.fontFamily==="Courier New"?" selected":"")+'>Courier New</option><option value="Impact"'+(key.fontFamily==="Impact"?" selected":"")+'>Impact</option></select>'+
    '<label>&#x21C5; Font Size</label><div class="stepper" style="margin:4px 0"><button onclick="var n=this.nextElementSibling;var v=parseInt(n.value)||10;v=Math.max(6,v-1);n.value=v;upk(\'fontSize\',v)">\u2212</button><input type="number" value="'+(key.fontSize||Math.max(8,(profile?.cellSize||60)*0.25))+'" onchange="upk(\'fontSize\',parseInt(this.value))" style="width:50px;text-align:center;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px;padding:2px 4px"><button onclick="var n=this.previousElementSibling;var v=parseInt(n.value)||10;v=Math.min(48,v+1);n.value=v;upk(\'fontSize\',v)">+</button></div>'+
    '</div>'+
    '<div style="margin-bottom:8px">'+
    '<label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Sound &amp; Size</label>'+
    '<label>&#x266B; Sound</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'>Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'>None</option><option value="click"'+(key.sound==="click"?" selected":"")+'>Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'>Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'>Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'>Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'>Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'>Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'>Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'>Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'>8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'>Electric Spark</option></select>'+(key.action==="dock"?'<label>&#x266B; Quit Sound</label><select onchange="upk(\'quitSound\',this.value)"><option value=""' + (!key.quitSound ? " selected" : "") + '>Inherit</option><option value="none"' + (key.quitSound === "none" ? " selected" : "") + '>None</option><option value="click"' + (key.quitSound === "click" ? " selected" : "") + '>Click</option><option value="soft"' + (key.quitSound === "soft" ? " selected" : "") + '>Soft</option><option value="mechanical"' + (key.quitSound === "mechanical" ? " selected" : "") + '>Mechanical</option><option value="deep"' + (key.quitSound === "deep" ? " selected" : "") + '>Deep</option><option value="red"' + (key.quitSound === "red" ? " selected" : "") + '>Red Switch</option><option value="topre"' + (key.quitSound === "topre" ? " selected" : "") + '>Topre EC</option><option value="glass"' + (key.quitSound === "glass" ? " selected" : "") + '>Glass Tap</option><option value="bubble"' + (key.quitSound === "bubble" ? " selected" : "") + '>Bubble Pop</option><option value="blip"' + (key.quitSound === "blip" ? " selected" : "") + '>8-bit Blip</option><option value="spark"' + (key.quitSound === "spark" ? " selected" : "") + '>Electric Spark</option><option value="quit"' + (key.quitSound === "quit" ? " selected" : "") + '>Quit (Saw)</option></select>'+
    '':"")+'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4(kw-0.25)+')">\u2212</button><span>'+kw.toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4(kw+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4(kh-0.25)+')">\u2212</button><span>'+kh.toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4(kh+0.25)+')">+</button></div></div></div>'+
    '<div class="br"><button class="btn-del" onclick="dkey()">Delete</button></div>';
var _ss=document.querySelectorAll("#pc select");for(var _i=0;_i<_ss.length;_i++){var _sel=_ss[_i];var _oc=_sel.getAttribute("onchange")||"";if(_oc.toLowerCase().indexOf("sound")<0)continue;var _b=document.createElement("button");_b.className="pv-btn";_b.innerHTML="&#x25B6;";_b.style.cssText="padding:4px 8px;font-size:12px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;margin-left:4px";_b.title="Preview";_b.onmouseover=function(){this.style.borderColor="var(--accent)"};_b.onmouseout=function(){this.style.borderColor="var(--border)"};_b.onclick=function(s){return function(e){e.preventDefault();e.stopPropagation();var v=s.value;if(!v||v===""){v=document.getElementById("tgs").value}if(v&&v!=="")testSnd(v)}}(_sel);_sel.parentNode.insertBefore(_b,_sel.nextSibling)}}


/* ── Color Picker ── */
var _cpPanel=null,_cpProp=null,_cpPresets=null,_cpHex="";
function rgbToHsl(R,G,B){R/=255;G/=255;B/=255;var max=Math.max(R,G,B),min=Math.min(R,G,B);var h=0,s,l=(max+min)/2;if(max!==min){var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case R:h=((G-B)/d+(G<B?6:0))/6;break;case G:h=((B-R)/d+2)/6;break;case B:h=((R-G)/d+4)/6;break}}return[h*360,s*100,l*100];}
function _cpLoadPresets(){try{_cpPresets=JSON.parse(localStorage.getItem("stp_color_presets"))||[]}catch(e){_cpPresets=[]}while(_cpPresets.length<8)_cpPresets.push("#ff0000")}
function showCP(prop,hex){
  if(_cpPanel){_cpPanel.remove();_cpPanel=null;}
  _cpProp=prop;_cpHex=hex;_cpLoadPresets();
  var d=document.createElement("div");
  d.id="cp-panel";
  d.style.cssText="position:fixed;z-index:99999;background:#2a2a3a;border:1px solid #666;border-radius:8px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,0.6);width:280px;font-family:-apple-system,sans-serif;user-select:none";
  // Color canvas
  var wrap=document.createElement("div");
  wrap.style.cssText="position:relative;width:256px;height:128px;margin:0 auto 8px;border-radius:4px;overflow:hidden;cursor:crosshair";
  var cv=document.createElement("canvas");
  cv.width=256;cv.height=128;cv.style.cssText="display:block;width:100%;height:100%";
  var ctx=cv.getContext("2d");
  for(var x=0;x<256;x++){var grad=ctx.createLinearGradient(0,0,0,128);grad.addColorStop(0,"hsl("+(x/256*360)+",100%,100%)");grad.addColorStop(0.5,"hsl("+(x/256*360)+",100%,50%)");grad.addColorStop(1,"hsl("+(x/256*360)+",100%,0%)");ctx.fillStyle=grad;ctx.fillRect(x,0,1,128);}
  var cr=document.createElement("div");
  cr.id="cp-cursor";cr.style.cssText="position:absolute;width:10px;height:10px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 3px #000;pointer-events:none;transform:translate(-50%,-50%)";
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  var hsl=rgbToHsl(r,g,b);cr.style.left=(hsl[0]/360*256)+"px";cr.style.top=((1-hsl[2]/100)*128)+"px";
  wrap.appendChild(cv);wrap.appendChild(cr);
  cv.onmousedown=function(e){cpCanvasPick(e,cv,cr);};
  cv.onmousemove=function(e){if(e.buttons)cpCanvasPick(e,cv,cr);};
  d.appendChild(wrap);
  // Swatch (draggable) + hex
  var hr=document.createElement("div");
  hr.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:10px";
  var sw=document.createElement("div");
  sw.id="cp-swatch";sw.draggable=true;
  sw.style.cssText="width:32px;height:32px;border-radius:4px;border:1px solid #555;cursor:grab;background:"+hex;
  sw.ondragstart=function(e){e.dataTransfer.setData("text/plain",_cpHex);e.dataTransfer.effectAllowed="copy";};
  var hi=document.createElement("input");
  hi.id="cp-hex";hi.value=hex;hi.spellcheck=false;
  hi.style.cssText="flex:1;background:#1a1a2e;color:#eee;border:1px solid #555;border-radius:3px;font-size:14px;padding:4px 8px;font-family:monospace;text-align:center";
  hi.oninput=function(){var v=this.value;if(!/^#[0-9a-fA-F]{6}$/.test(v))return;_cpHex=v;sw.style.background=v;var R=parseInt(v.slice(1,3),16),G=parseInt(v.slice(3,5),16),B=parseInt(v.slice(5,7),16);var hsl2=rgbToHsl(R,G,B);cr.style.left=(hsl2[0]/360*256)+"px";cr.style.top=((1-hsl2[2]/100)*128)+"px";upkLive(_cpProp,v);};
  hr.appendChild(sw);hr.appendChild(hi);d.appendChild(hr);
  // 8 preset slots
  var ps=document.createElement("div");
  ps.style.cssText="display:flex;gap:6px;flex-wrap:wrap";
  for(var i=0;i<8;i++){(function(idx){var sl=document.createElement("div");sl.style.cssText="width:28px;height:28px;border-radius:4px;border:1px solid #555;cursor:pointer;background:"+_cpPresets[idx]+";box-shadow:0 1px 3px rgba(0,0,0,0.3)";sl.title="Click: use | Drag swatch here: save";sl.onclick=function(){var c=_cpPresets[idx];_cpHex=c;document.getElementById("cp-hex").value=c;sw.style.background=c;var R=parseInt(c.slice(1,3),16),G=parseInt(c.slice(3,5),16),B=parseInt(c.slice(5,7),16);var hsl2=rgbToHsl(R,G,B);cr.style.left=(hsl2[0]/360*256)+"px";cr.style.top=((1-hsl2[2]/100)*128)+"px";upkLive(_cpProp,c);};sl.ondragover=function(e){e.preventDefault();e.dataTransfer.dropEffect="copy";this.style.borderColor="#fff";};sl.ondragleave=function(){this.style.borderColor="#555";};sl.ondrop=function(e){e.preventDefault();this.style.borderColor="#555";var c=e.dataTransfer.getData("text/plain");_cpPresets[idx]=c;this.style.background=c;localStorage.setItem("stp_color_presets",JSON.stringify(_cpPresets));};ps.appendChild(sl);})(i);}
  d.appendChild(ps);
  document.body.appendChild(d);
  _cpPanel=d;
  // Click outside → close
  setTimeout(function(){
    document.addEventListener("mousedown",_cpClickOutside,true);
  },0);
  var btn=document.querySelector('[data-cp="'+prop+'"]');
  if(btn){var rect=btn.getBoundingClientRect();d.style.left=Math.min(rect.left,window.innerWidth-296)+"px";d.style.top=Math.min(rect.bottom+4,window.innerHeight-260)+"px";}
  else{d.style.left="50%";d.style.top="50%";d.style.transform="translate(-50%,-50%)";}
}
function _cpClickOutside(e){
  var p=document.getElementById("cp-panel");
  if(!p)return;
  var btn=document.querySelector('[data-cp="'+_cpProp+'"]');
  if(p.contains(e.target)||(btn&&btn.contains(e.target)))return;
  _cpClose();
}
function _cpClose(){
  var p=document.getElementById("cp-panel");
  if(p){p.remove();_cpPanel=null;}
  document.removeEventListener("mousedown",_cpClickOutside,true);
  if(_cpProp&&_cpProp.indexOf("grp")===0){var _rp=_cpProp.replace("grp","");_rp=_rp.charAt(0).toLowerCase()+_rp.slice(1);upkGroup(_rp,_cpHex)}else{upk(_cpProp,_cpHex)}
}
function cpCanvasPick(e,cv,cr){
  var rect=cv.getBoundingClientRect();
  var x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
  var y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));
  cr.style.left=(x*256)+"px";cr.style.top=(y*128)+"px";
  var px=cv.getContext("2d").getImageData(Math.floor(x*256),Math.floor(y*128),1,1).data;
  var hex="#"+px[0].toString(16).padStart(2,"0")+px[1].toString(16).padStart(2,"0")+px[2].toString(16).padStart(2,"0");
  _cpHex=hex;
  document.getElementById("cp-hex").value=hex;
  document.getElementById("cp-swatch").style.background=hex;
  upkLive(_cpProp,hex);
}

function upkLive(prop,val){
  const key=cp_()?.keys.find(k=>k.id===selKey);if(!key)return;
  key[prop]=val;dirty=true;rr();
}

/* ── Color Picker ── */
var _cpPanel=null,_cpProp=null,_cpPresets=null,_cpHex="";
function rgbToHsl(R,G,B){R/=255;G/=255;B/=255;var max=Math.max(R,G,B),min=Math.min(R,G,B);var h=0,s,l=(max+min)/2;if(max!==min){var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case R:h=((G-B)/d+(G<B?6:0))/6;break;case G:h=((B-R)/d+2)/6;break;case B:h=((R-G)/d+4)/6;break}}return[h*360,s*100,l*100];}
function _cpLoadPresets(){try{_cpPresets=JSON.parse(localStorage.getItem("stp_color_presets"))||[]}catch(e){_cpPresets=[]}while(_cpPresets.length<8)_cpPresets.push("#ff0000")}
function showCP(prop,hex){
  if(_cpPanel){_cpPanel.remove();_cpPanel=null;}
  _cpProp=prop;_cpHex=hex;_cpLoadPresets();
  var d=document.createElement("div");
  d.id="cp-panel";
  d.style.cssText="position:fixed;z-index:99999;background:#2a2a3a;border:1px solid #666;border-radius:8px;padding:12px;box-shadow:0 8px 32px rgba(0,0,0,0.6);width:280px;font-family:-apple-system,sans-serif;user-select:none";
  // Color canvas
  var wrap=document.createElement("div");
  wrap.style.cssText="position:relative;width:256px;height:128px;margin:0 auto 8px;border-radius:4px;overflow:hidden;cursor:crosshair";
  var cv=document.createElement("canvas");
  cv.width=256;cv.height=128;cv.style.cssText="display:block;width:100%;height:100%";
  var ctx=cv.getContext("2d");
  for(var x=0;x<256;x++){var grad=ctx.createLinearGradient(0,0,0,128);grad.addColorStop(0,"hsl("+(x/256*360)+",100%,100%)");grad.addColorStop(0.5,"hsl("+(x/256*360)+",100%,50%)");grad.addColorStop(1,"hsl("+(x/256*360)+",100%,0%)");ctx.fillStyle=grad;ctx.fillRect(x,0,1,128);}
  var cr=document.createElement("div");
  cr.id="cp-cursor";cr.style.cssText="position:absolute;width:10px;height:10px;border:2px solid #fff;border-radius:50%;box-shadow:0 0 3px #000;pointer-events:none;transform:translate(-50%,-50%)";
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  var hsl=rgbToHsl(r,g,b);cr.style.left=(hsl[0]/360*256)+"px";cr.style.top=((1-hsl[2]/100)*128)+"px";
  wrap.appendChild(cv);wrap.appendChild(cr);
  cv.onmousedown=function(e){cpCanvasPick(e,cv,cr);};
  cv.onmousemove=function(e){if(e.buttons)cpCanvasPick(e,cv,cr);};
  d.appendChild(wrap);
  // Swatch (draggable) + hex
  var hr=document.createElement("div");
  hr.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:10px";
  var sw=document.createElement("div");
  sw.id="cp-swatch";sw.draggable=true;
  sw.style.cssText="width:32px;height:32px;border-radius:4px;border:1px solid #555;cursor:grab;background:"+hex;
  sw.ondragstart=function(e){e.dataTransfer.setData("text/plain",_cpHex);e.dataTransfer.effectAllowed="copy";};
  var hi=document.createElement("input");
  hi.id="cp-hex";hi.value=hex;hi.spellcheck=false;
  hi.style.cssText="flex:1;background:#1a1a2e;color:#eee;border:1px solid #555;border-radius:3px;font-size:14px;padding:4px 8px;font-family:monospace;text-align:center";
  hi.oninput=function(){var v=this.value;if(!/^#[0-9a-fA-F]{6}$/.test(v))return;_cpHex=v;sw.style.background=v;var R=parseInt(v.slice(1,3),16),G=parseInt(v.slice(3,5),16),B=parseInt(v.slice(5,7),16);var hsl2=rgbToHsl(R,G,B);cr.style.left=(hsl2[0]/360*256)+"px";cr.style.top=((1-hsl2[2]/100)*128)+"px";upkLive(_cpProp,v);};
  hr.appendChild(sw);hr.appendChild(hi);d.appendChild(hr);
  // 8 preset slots
  var ps=document.createElement("div");
  ps.style.cssText="display:flex;gap:6px;flex-wrap:wrap";
  for(var i=0;i<8;i++){(function(idx){var sl=document.createElement("div");sl.style.cssText="width:28px;height:28px;border-radius:4px;border:1px solid #555;cursor:pointer;background:"+_cpPresets[idx]+";box-shadow:0 1px 3px rgba(0,0,0,0.3)";sl.title="Click: use | Drag swatch here: save";sl.onclick=function(){var c=_cpPresets[idx];_cpHex=c;document.getElementById("cp-hex").value=c;sw.style.background=c;var R=parseInt(c.slice(1,3),16),G=parseInt(c.slice(3,5),16),B=parseInt(c.slice(5,7),16);var hsl2=rgbToHsl(R,G,B);cr.style.left=(hsl2[0]/360*256)+"px";cr.style.top=((1-hsl2[2]/100)*128)+"px";upkLive(_cpProp,c);};sl.ondragover=function(e){e.preventDefault();e.dataTransfer.dropEffect="copy";this.style.borderColor="#fff";};sl.ondragleave=function(){this.style.borderColor="#555";};sl.ondrop=function(e){e.preventDefault();this.style.borderColor="#555";var c=e.dataTransfer.getData("text/plain");_cpPresets[idx]=c;this.style.background=c;localStorage.setItem("stp_color_presets",JSON.stringify(_cpPresets));};ps.appendChild(sl);})(i);}
  d.appendChild(ps);
  document.body.appendChild(d);
  _cpPanel=d;
  // Click outside → close
  setTimeout(function(){
    document.addEventListener("mousedown",_cpClickOutside,true);
  },0);
  var btn=document.querySelector('[data-cp="'+prop+'"]');
  if(btn){var rect=btn.getBoundingClientRect();d.style.left=Math.min(rect.left,window.innerWidth-296)+"px";d.style.top=Math.min(rect.bottom+4,window.innerHeight-260)+"px";}
  else{d.style.left="50%";d.style.top="50%";d.style.transform="translate(-50%,-50%)";}
}
function _cpClickOutside(e){
  var p=document.getElementById("cp-panel");
  if(!p)return;
  var btn=document.querySelector('[data-cp="'+_cpProp+'"]');
  if(p.contains(e.target)||(btn&&btn.contains(e.target)))return;
  _cpClose();
}
function _cpClose(){
  var p=document.getElementById("cp-panel");
  if(p){p.remove();_cpPanel=null;}
  document.removeEventListener("mousedown",_cpClickOutside,true);
  if(_cpProp&&_cpProp.indexOf("grp")===0){var _rp=_cpProp.replace("grp","");_rp=_rp.charAt(0).toLowerCase()+_rp.slice(1);upkGroup(_rp,_cpHex)}else{upk(_cpProp,_cpHex)}
}
function cpCanvasPick(e,cv,cr){
  var rect=cv.getBoundingClientRect();
  var x=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
  var y=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));
  cr.style.left=(x*256)+"px";cr.style.top=(y*128)+"px";
  var px=cv.getContext("2d").getImageData(Math.floor(x*256),Math.floor(y*128),1,1).data;
  var hex="#"+px[0].toString(16).padStart(2,"0")+px[1].toString(16).padStart(2,"0")+px[2].toString(16).padStart(2,"0");
  _cpHex=hex;
  document.getElementById("cp-hex").value=hex;
  document.getElementById("cp-swatch").style.background=hex;
  upkLive(_cpProp,hex);
}

function upkLiveGroup(prop,val){
  const page=cp_();if(!page)return;
  selKeys.forEach(function(kid){
    var k=page.keys.find(function(x){return x.id===kid});
    if(k)k[prop]=val;
  });
  dirty=true;rr();
}
function upk(prop,val){const key=cp_()?.keys.find(k=>k.id===selKey);if(!key)return;const before=_snapshot(key);if(prop==="w"||prop==="h")val=Math.max(0.25,_snap4(parseFloat(val)||1));key[prop]=val;dirty=true;if(JSON.stringify(before)!==JSON.stringify(_snapshot(key))){_pushUndo([before])}rr();rpr()}
function upkGroupStepSzVal(val){var page=cp_();if(!page)return;val=Math.max(6,Math.min(48,Math.round(val)));var before=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});selKeys.forEach(function(kid){var k=page.keys.find(function(x){return x.id===kid});if(k)k.fontSize=val});_pushUndo(before);dirty=true;rr();rpr();}
function upkGroupStepSz(delta){var page=cp_();if(!page)return;var before=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});selKeys.forEach(function(kid){var k=page.keys.find(function(x){return x.id===kid});if(k){var cur=k.fontSize||Math.max(8,(profile?.cellSize||60)*0.25);k.fontSize=Math.max(6,Math.min(48,Math.round(cur+delta)))}});_pushUndo(before);dirty=true;rr();rpr();}
function upkGroupStep(prop,delta){
  var page=cp_();if(!page)return;
  var before=page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)});
  var isW=prop==="w";
  // Add delta
  page.keys.forEach(function(k){
    if(!selKeys.has(k.id))return;
    var o=before.find(function(x){return x.id===k.id});if(!o)return;
    if(isW){k.w=_snap4(Math.max(0.25,o.w+delta))}else{k.h=_snap4(Math.max(0.25,o.h+delta))}
  });
  // Group by perpendicular overlap (not exact equality)
  var used={};var groups=[];
  before.forEach(function(o){
    if(used[o.id])return;
    var grp=[o];used[o.id]=true;
    var changed=true;
    while(changed){ // expand group: include all keys that overlap any key in group
      changed=false;
      before.forEach(function(p){
        if(used[p.id])return;
        for(var gi=0;gi<grp.length;gi++){
          var g=grp[gi];
          var overlap=isW?!(g.row+g.h<=p.row||p.row+p.h<=g.row):!(g.col+g.w<=p.col||p.col+p.w<=g.col);
          if(overlap){grp.push(p);used[p.id]=true;changed=true;break}
        }
      });
    }
    groups.push(grp);
  });
  // Within each group, sort and shift
  for(var g=0;g<groups.length;g++){
    var arr=groups[g].sort(function(a,b){return isW?(a.col-b.col):(a.row-b.row)});
    for(var i=0;i<arr.length;i++){
      var k=page.keys.find(function(x){return x.id===arr[i].id});if(!k)continue;
      if(isW){k.col=arr[i].col}else{k.row=arr[i].row}
      if(i===0)continue;
      var prevO=arr[i-1],prevK=page.keys.find(function(x){return x.id===prevO.id});
      var prevEdge=isW?(prevK.col+prevK.w):(prevK.row+prevK.h);
      var origEdge=isW?(prevO.col+prevO.w):(prevO.row+prevO.h);
      var origStart=isW?arr[i].col:arr[i].row;
      var g2=origStart-origEdge;
      if(g2>=0){if(isW){k.col=_snap4(prevEdge+g2)}else{k.row=_snap4(prevEdge+g2)}}
    }
  }
  _pushUndo(before);dirty=true;rr();rpr();
}
function upkGroup(prop,val){const page=cp_();if(!page)return;const before=page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k));selKeys.forEach(kid=>{const k=page.keys.find(x=>x.id===kid);if(k){if(prop==="w"||prop==="h")val=Math.max(0.25,_snap4(parseFloat(val)||1));k[prop]=val}});_pushUndo(before);dirty=true;rr();rpr();}


let captureMode=false;

document.addEventListener("keydown",e=>{
  if(!captureMode)return;
  e.preventDefault();e.stopPropagation();
  if(["Shift","Control","Alt","Meta"].includes(e.key))return;
  let combo="";
  if(e.metaKey)combo+="COMMAND+";
  if(e.ctrlKey)combo+="CONTROL+";
  if(e.altKey)combo+="OPTION+";
  if(e.shiftKey&&e.key.length>1)combo+="SHIFT+";
  const KM={Enter:"ENTER",Escape:"ESCAPE",Tab:"TAB",Backspace:"DELETE"," ":"SPACE",ArrowUp:"UP",ArrowDown:"DOWN",ArrowLeft:"LEFT",ArrowRight:"RIGHT"};
  combo+=KM[e.key]||e.key.toUpperCase();
  upk("value",combo);
  captureMode=false;
  document.getElementById("captureHint").textContent="Captured: "+combo;
  setTimeout(()=>{document.getElementById("captureHint").textContent=""},2000);
},{capture:true});
function openProfileManager(){var pm=document.getElementById("profileManagerModal");pm.style.display="flex";pmRender();}
function pmRender(){var el=document.getElementById("pmList");el.innerHTML=profiles.map(function(p,i){return"<div style=\"display:flex;align-items:center;gap:8px;padding:8px 10px;margin:3px 0;border-radius:6px;background:#272421\"><input value=\""+hesc(p.profileName)+"\" data-fn=\""+p.filename+"\" onkeydown=\"if(event.key==='Enter'){var fn=this.getAttribute('data-fn');var nm=this.value;if(fn&&nm)pmRename(fn,nm)}\" style=\"flex:1;padding:5px 8px;background:#151210;color:#e8e0d8;border:1px solid rgba(255,255,255,0.05);border-radius:4px;font-size:12px\"><button onclick=\"dp('"+p.filename+"');setTimeout(pmRender,300)\" style=\"padding:4px 10px;font-size:11px;background:#5c3028;color:#e8e0d8;border:none;border-radius:4px;cursor:pointer;font-weight:600\">X</button></div>"}).join("");}
function pmConfirm(fn,btn){var row=btn.parentElement;var inp=row.querySelector("input");var nm=inp?inp.value:"";if(!nm||!fn)return;pmRename(fn,nm)}

function pmRename(fn,nm){if(!nm)return;fetch("/api/profiles/"+encodeURIComponent(fn),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileName:nm})}).then(function(r){return r.json()}).then(function(){if(fn===activeProfile&&profile)profile.profileName=nm;lpl();setTimeout(pmRender,200)})}
function pmCreate(){var p={profileName:"New Profile",version:"1.0",device:"iPad 11\"",deviceWidth:834,deviceHeight:1210,cellSize:60,gap:0,canvasX:0,canvasY:0,defaultSound:"click",windowRules:[],pages:[{id:"main",label:"Main",keys:[]}],groups:[]};fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}).then(function(r){return r.json()}).then(function(d){if(d.filename){lpl();renderAll();setTimeout(pmRender,200)}})}
function copyStyle(){if(!selKey&&selKeys.size===0)return;var k;if(selKey){k=cp_()?.keys.find(function(x){return x.id===selKey})}else{var page=cp_();if(!page)return;var keys=page.keys.filter(function(k){return selKeys.has(k.id)});if(!keys.length)return;k=keys[0]}if(!k)return;copiedStyle={borderRadius:k.borderRadius,color:k.color,fontColor:k.fontColor,fontFamily:k.fontFamily,fontSize:k.fontSize,sound:k.sound};t("Style copied")}
function pasteStyle(){if(!copiedStyle)return;var page=cp_();if(!page)return;var targets;if(selKeys.size>0){targets=page.keys.filter(function(k){return selKeys.has(k.id)})}else if(selKey){targets=[page.keys.find(function(k){return k.id===selKey})]}else{return}if(!targets.length)return;var snapshots=targets.map(function(k){return _snapshot(k)});targets.forEach(function(k){if(copiedStyle.borderRadius!==undefined)k.borderRadius=copiedStyle.borderRadius;if(copiedStyle.color!==undefined)k.color=copiedStyle.color;if(copiedStyle.fontColor!==undefined)k.fontColor=copiedStyle.fontColor;if(copiedStyle.fontFamily!==undefined)k.fontFamily=copiedStyle.fontFamily;if(copiedStyle.fontSize!==undefined)k.fontSize=copiedStyle.fontSize;if(copiedStyle.sound!==undefined)k.sound=copiedStyle.sound});_pushUndo(snapshots);dirty=true;rr();rpr();t("Style pasted")}
function delSelected(){if(!confirm("Delete "+selKeys.size+" keys?"))return;const page=cp_();if(!page)return;const before=page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k));page.keys=page.keys.filter(k=>!selKeys.has(k.id));_pushUndo(before);selKeys.clear();selKey=null;dirty=true;renderAll();}

var WIDGET_TYPES={key:{label:"Regular Key",defaults:{w:1,h:1,color:"#0f3460",action:"hold"}},touchpad:{label:"Touch Pad",defaults:{w:4,h:3,color:"#2a3a5a",action:"touchpad"}},volume:{label:"Volume Slider",defaults:{w:3,h:1,color:"#1a2a1a",action:"volume"}},mute:{label:"Mute Toggle",defaults:{w:1,h:1,color:"#2a1a1a",action:"mute"}},micmute:{label:"Mic Mute",defaults:{w:1,h:1,color:"#1a2a2a",action:"mic-mute"}},audioout:{label:"Audio Out",defaults:{w:3,h:1,color:"#1a1a2a",action:"audio-out"}},audioin:{label:"Audio In",defaults:{w:3,h:1,color:"#1a2a2a",action:"audio-in"}},activeapp:{label:"Active App",defaults:{w:3,h:1,color:"#1a1a1a",action:"active-app"}},winshortcuts:{label:"Win Shortcuts",defaults:{w:4,h:2,color:"#1a2a2a",action:"win-shortcuts"}},dock:{label:"Dock Panel",defaults:{w:4,h:4,color:"#1a1a1a",action:"dock"}},appmenu:{label:"App Menu",defaults:{w:4,h:5,color:"#1a1a2a",action:"app-menu"}},layoutpreset:{label:"Layout Preset",defaults:{w:4,h:4,color:"#1a1a3a",action:"layout-preset"}},visualizer:{label:"Audio Visualizer",defaults:{w:4,h:2,color:"#0a1a10",action:"visualizer"}},balance:{label:"Deepseek Balance",defaults:{w:4,h:1,color:"#1a1405",action:"balance"}}};;function addKeyOfType(type){
  var page=cp_();if(!page)return;
  var wt=WIDGET_TYPES[type]||WIDGET_TYPES.key;
  var d=wt.defaults;
  page.keys.push({id:"k_"+Date.now(),label:"?",action:d.action,value:"A",
    color:d.color,col:window._pendingCol||0,row:window._pendingRow||0,w:d.w,h:d.h,sound:""});
  _pushUndo([]);selKey=page.keys[page.keys.length-1].id;selKeys.clear();selKeys.add(selKey);
  dirty=true;closeKeyTypeModal();rr();rpr();
}
function closeKeyTypeModal(){document.getElementById("keyTypeModal").style.display="none";document.getElementById("gh").style.display="none"}
function dkey(){if(!selKey||!confirm("Delete?"))return;const p=cp_();const k=p.keys.find(k=>k.id===selKey);if(k){_pushUndo([_snapshot(k)])}p.keys=p.keys.filter(k=>k.id!==selKey);selKeys.delete(selKey);selKey=null;dirty=true;renderAll()}

// ── Sound ──
const SND={none:null,click:[800,0.06,"square",0.3],soft:[400,0.08,"sine",0.2],mechanical:[1200,0.04,"square",0.4],deep:[200,0.1,"triangle",0.5],red:[300,0.04,"sine",0.15],topre:[500,0.07,"sine",0.18,900,0.008],glass:[2400,0.05,"sine",0.12],bubble:[600,0.06,"sine",0.22,"sweep"],blip:[440,0.05,"square",0.2,"sweep"],spark:[3000,0.02,"sawtooth",0.1,0.4]};
let actx=null;
function testSnd(nm){if(!nm||nm==="none")return;const s=SND[nm];if(!s)return;try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.type=s[2];if(s[4]==="sweep"){o.frequency.setValueAtTime(s[0]*1.5,actx.currentTime);o.frequency.exponentialRampToValueAtTime(s[0]*0.5,actx.currentTime+s[1])}else{o.frequency.setValueAtTime(s[0],actx.currentTime)}g.gain.setValueAtTime(s[3],actx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+s[1]);o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+s[1]);if(s.length===6){const o2=actx.createOscillator(),g2=actx.createGain();o2.type="square";o2.frequency.setValueAtTime(s[4],actx.currentTime+0.003);g2.gain.setValueAtTime(s[3]*0.5,actx.currentTime+0.003);g2.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+s[5]);o2.connect(g2);g2.connect(actx.destination);o2.start(actx.currentTime+0.003);o2.stop(actx.currentTime+s[5])}if(s.length===5&&typeof s[4]==="number"){const bs=actx.sampleRate*s[1],buf=actx.createBuffer(1,bs,actx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<bs;i++)d[i]=(Math.random()*2-1)*s[4];const n=actx.createBufferSource(),gn=actx.createGain();n.buffer=buf;gn.gain.setValueAtTime(s[3]*0.3,actx.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+s[1]*0.5);n.connect(gn);gn.connect(actx.destination);n.start(actx.currentTime)}}catch(e){}}

function t(msg){const el=document.getElementById("toast");el.textContent=msg;el.className="toast";el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2000)}

window.addEventListener("resize",()=>rr());
setTimeout(function(){var lp=document.getElementById("lp-panel");var rp=document.getElementById("rp-profile");if(lp&&rp){var children=rp.children;var toMove=[];for(var i=0;i<children.length;i++){var c=children[i];if(c.tagName!=="DIV"||c.id==="pl")continue;if(c.className==="rp-section"||c.className==="rp-divider")toMove.push(c)}for(var i=0;i<toMove.length;i++){lp.appendChild(toMove[i]);toMove[i].style.opacity='1'}}},200);cws();lpl();lp(localStorage.getItem("stp_active")||"Default.json");