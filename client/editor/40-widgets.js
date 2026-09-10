// ── Props ──
function rpr(){var has=!!(selKey||selKeys.size>0);document.getElementById("rp-library").style.display=has?"none":"block";document.getElementById("rp-props").style.display=has?"block":"none";_updateClipboardPanel();var _pc0=document.getElementById("pc");if(_pc0){_pc0.classList.remove("rp-fade");void _pc0.offsetWidth;_pc0.classList.add("rp-fade")}var _gb=document.getElementById("btnSaveGroup");if(_gb){var _ge=selKeys.size>1;_gb.style.opacity=_ge?"1":"0.4";_gb.style.pointerEvents=_ge?"auto":"none";_gb.title=_ge?"":(selKeys.size===1?"Select 1 more key to group":"Select 2+ keys to group")}
  if(selKeys.size>1){
    var pg2=cp_(),commonColor="#0f3460",colorCount=0,clrs=new Set(),sndSet=new Set(),commonSound="";
    for(var i=0;i<pg2.keys.length;i++){if(selKeys.has(pg2.keys[i].id)){var k2=pg2.keys[i];var cc=k2.color||"#0f3460";commonColor=cc;clrs.add(cc);var snd2=k2.sound||"";commonSound=snd2;sndSet.add(snd2)}}var sndCount=sndSet.size;if(sndSet.size===1)commonSound=[...sndSet][0];colorCount=clrs.size;if(clrs.size===1)commonColor=[...clrs][0];
var sndOpts="";var _sounds=_SE_SOUNDS;for(var _si=0;_si<_sounds.length;_si++){var _sv=_sounds[_si][0],_sl=_sounds[_si][1];sndOpts+="<option value=\""+_sv+"\""+(sndCount===1&&commonSound===_sv?" selected":"")+">"+_sl+"</option>"}
    document.getElementById("pc").innerHTML=
      "<p style=\"font-size:11px;color:var(--dim);margin-bottom:6px\">"+selKeys.size+" keys selected</p>"+
      "<label>Label <small style=\"color:var(--dim)\">(inactive)</small></label><input disabled style=\"opacity:0.4;width:100%;padding:4px 6px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px\">"+
      "<label>Color (all)</label>"+
      (colorCount>1?"<input type=\"color\" value=\"#0f3460\" oninput=\"upkLiveGroup(\'color\',this.value)\" onchange=\"upkGroup(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">":"<input type=\"color\" value=\""+commonColor+"\" oninput=\"upkLiveGroup(\'color\',this.value)\" onchange=\"upkGroup(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">")+
      "<label>Width (all) \u00b10.25</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"upkGroupStep('w',-0.25)\">\u2212</button><span>0.25</span><button onclick=\"upkGroupStep('w',0.25)\">+</button></div>"+
      "<label>Height (all) \u00b10.25</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"upkGroupStep('h',-0.25)\">\u2212</button><span>0.25</span><button onclick=\"upkGroupStep('h',0.25)\">+</button></div>"+
      "<div class=\"br\" style=\"margin-top:4px\"><button class=\"btn-del\" onclick=\"delSelected()\">Delete Selected</button></div>";var _ss2=document.querySelectorAll("#pc select");for(var _i2=0;_i2<_ss2.length;_i2++){var _s2=_ss2[_i2];var _oc2=_s2.getAttribute("onchange")||"";if(_oc2.toLowerCase().indexOf("sound")<0)continue;var _b2=document.createElement("button");_b2.className="pv-btn";_b2.innerHTML="&#x25B6;";_b2.style.cssText="padding:4px 8px;font-size:12px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;margin-left:4px";_b2.onmouseover=function(){this.style.borderColor="var(--accent)"};_b2.onmouseout=function(){this.style.borderColor="var(--border)"};_b2.onclick=function(s){return function(e){e.preventDefault();e.stopPropagation();var v=s.value;if(!v||v===""){v=(profile&&profile.defaultSound)||"click"}if(v&&v!=="")testSnd(v)}}(_s2);_s2.parentNode.insertBefore(_b2,_s2.nextSibling)}
    _addStyleBtns();
    return;
  }
  const key=selKey?cp_()?.keys.find(k=>k.id===selKey):null;
  if(key&&key.action==="balance"){document.getElementById("pc").innerHTML="<div style=\"margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)\">"+"<label style=\"color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px\">Deepseek Balance</label>"+"<p style=\"font-size:10px;color:var(--dim);margin:4px 0\">API credit remaining</p>"+"</div>"+"<label>API Key</label><div style=\"display:flex;align-items:center;gap:6px\">"+(key.hasApiKey||key.apiKey?"<span style=\"color:#4ade80;font-size:12px\">✓ Configured</span>":"<span style=\"color:#f59e0b;font-size:12px\">✗ Not configured</span>")+"<button onclick=\"openApiKeyModal()\" style=\"padding:4px 10px;background:var(--accent);color:#1a1a1a;border:none;border-radius:3px;cursor:pointer;font-size:11px;font-weight:600\">"+(key.hasApiKey||key.apiKey?"Change":"Set")+"</button></div>"+"<label>Label</label><input value=\""+hesc(key.label)+"\" oninput=\"upk('label',this.value)\">"+"<label>Color</label><input type=\"color\" value=\""+(key.color||"#0d1117")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<div style=\"margin-top:10px;padding-top:8px;border-top:1px solid var(--border)\">"+"<label style=\"font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block\">Show Fields</label>"+"<div style=\"display:flex;flex-direction:column;gap:4px\">"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upkShowFlag('total',this.checked)\" style=\"width:16px;height:16px\" "+(key.showFlags&&key.showFlags.total===false?"":"checked")+"><span>Total Balance</span></label>"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upkShowFlag('topped',this.checked)\" style=\"width:16px;height:16px\" "+(key.showFlags&&key.showFlags.topped===false?"":"checked")+"><span>Rate (Peak/Off-peak)</span></label>"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upkShowFlag('granted',this.checked)\" style=\"width:16px;height:16px\" "+(key.showFlags&&key.showFlags.granted===false?"":"checked")+"><span>Today spent</span></label></div></div>"+"<label>&#x266B; Sound</label><select onchange=\"upk('sound',this.value)\"><option value=\"\""+(!key.sound?" selected":"")+">Inherit</option><option value=\"none\""+(key.sound==="none"?" selected":"")+">None</option><option value=\"click\""+(key.sound==="click"?" selected":"")+">Click</option><option value=\"soft\""+(key.sound==="soft"?" selected":"")+">Soft</option><option value=\"mechanical\""+(key.sound==="mechanical"?" selected":"")+">Mechanical</option><option value=\"deep\""+(key.sound==="deep"?" selected":"")+">Deep</option><option value=\"red\""+(key.sound==="red"?" selected":"")+">Red Switch</option><option value=\"topre\""+(key.sound==="topre"?" selected":"")+">Topre EC</option><option value=\"glass\""+(key.sound==="glass"?" selected":"")+">Glass Tap</option><option value=\"bubble\""+(key.sound==="bubble"?" selected":"")+">Bubble Pop</option><option value=\"blip\""+(key.sound==="blip"?" selected":"")+">8-bit Blip</option><option value=\"spark\""+(key.sound==="spark"?" selected":"")+">Electric Spark</option></select>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk('w',"+_snap4((key.w||3.5)-0.25)+")\">−</button><span>"+(key.w||3.5).toFixed(2)+"</span><button onclick=\"upk('w',"+_snap4((key.w||3.5)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk('h',"+_snap4((key.h||1.25)-0.25)+")\">−</button><span>"+(key.h||1.25).toFixed(2)+"</span><button onclick=\"upk('h',"+_snap4((key.h||1.25)+0.25)+")\">+</button></div></div></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addSndPreviews();return;}if(key&&key.action==="touchpad"){document.getElementById("pc").innerHTML="<div style=\"margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)\">"+"<label style=\"color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px\">Touch Pad</label>"+"<p style=\"font-size:10px;color:var(--dim);margin:4px 0\">1 finger = move | 2 fingers = scroll</p>"+"</div>"+"<label>&#x25C6; Label</label><input data-fn=\"'+hesc(p.filename)+'\" value=\""+hesc(key.label)+"\" oninput=\"upk('label',this.value)\">"+"<label>&#x25CF; Color</label><input type=\"color\" value=\""+(key.color||"#2a3a5a")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label style=\"font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin:6px 0 4px;display:block\">Options</label>"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upk('scrollEnabled',this.checked)\" style=\"width:16px;height:16px\" "+(key.scrollEnabled===false?"":"checked")+"><span>Enable Scrolling</span></label>"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text);cursor:pointer\"><input type=\"checkbox\" onchange=\"upk('rightClickEnabled',this.checked)\" style=\"width:16px;height:16px\" "+(key.rightClickEnabled===false?"":"checked")+"><span>Enable Right Click</span></label>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk('w',"+_snap4((key.w||4)-0.25)+")\">\u2212</button><span>"+(key.w||4).toFixed(2)+"</span><button onclick=\"upk('w',"+_snap4((key.w||4)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk('h',"+_snap4((key.h||3)-0.25)+")\">\u2212</button><span>"+(key.h||3).toFixed(2)+"</span><button onclick=\"upk('h',"+_snap4((key.h||3)+0.25)+")\">+</button></div></div></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addStyleBtns();return;}if(key&&(key.action==="win-shortcuts"||key.action==="win-gesture")){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Window Control</label><p style="font-size:10px;color:var(--dim);margin:4px 0">macOS window tiling</p></div>'+'<label>&#x25CF; Background</label><input type="color" value="'+(key.color||"#1a2a2a")+'" oninput="upkLive(\'color\',this.value)" onchange="upk(\'color\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'+'<label>&#x25D1; Bg Opacity</label><div style="margin:2px 0;display:flex;gap:4px;align-items:center"><input type=range min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:1.0)*100)+'" oninput="upkLive(\'bgOpacity\',parseInt(this.value)/100);this.nextElementSibling.value=this.value" onchange="upk(\'bgOpacity\',parseInt(this.value)/100)"><input type=number min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:1.0)*100)+'" onchange="this.previousElementSibling.value=this.value;upk(\'bgOpacity\',parseInt(this.value)/100)" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+'<label>&#x25D0; Icon Color</label><input type="color" value="'+(key.iconColor||"#cfd8dc")+'" oninput="upkLive(\'iconColor\',this.value)" onchange="upk(\'iconColor\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'+'<label>&#x266B; Sound</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'">Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'">None</option><option value="click"'+(key.sound==="click"?" selected":"")+'">Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'">Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'">Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'">Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'">Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'">Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'">Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'">Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'">8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'">Electric Spark</option></select>'+'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4((key.w||4)-0.25)+')">−</button><span>'+(key.w||4).toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4((key.w||4)+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4((key.h||2)-0.25)+')">−</button><span>'+(key.h||2).toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4((key.h||2)+0.25)+')">+</button></div></div></div>'+'<div class="br"><button class="btn-del" onclick="dkey()">Delete</button></div>';_addSndPreviews();return;}if(key&&key.action==="active-app"){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Window Switcher</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Tap to focus, hold to close</p></div>'+'<label>&#x25CF; Color</label><input type="color" value="'+(key.color||"#1a1a1a")+'" oninput="upkLive(\'color\',this.value)" onchange="upk(\'color\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'+'<label>&#x25D1; Bg Opacity</label><div style="margin:2px 0;display:flex;gap:4px;align-items:center"><input type=range min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:1.0)*100)+'" oninput="upkLive(\'bgOpacity\',parseInt(this.value)/100);this.nextElementSibling.value=this.value" onchange="upk(\'bgOpacity\',parseInt(this.value)/100)"><input type=number min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:1.0)*100)+'" onchange="this.previousElementSibling.value=this.value;upk(\'bgOpacity\',parseInt(this.value)/100)" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+'<label>&#x266B; Sound (tap)</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'>Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'>None</option><option value="click"'+(key.sound==="click"?" selected":"")+'>Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'>Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'>Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'>Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'>Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'>Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'>Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'>Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'>8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'>Electric Spark</option></select>'+'<label>&#x266B; Close Sound</label><select onchange="upk(\'closeSound\',this.value)"><option value=""'+(!key.closeSound?" selected":"")+'>Inherit</option><option value="none"'+(key.closeSound==="none"?" selected":"")+'>None</option><option value="click"'+(key.closeSound==="click"?" selected":"")+'>Click</option><option value="soft"'+(key.closeSound==="soft"?" selected":"")+'>Soft</option><option value="mechanical"'+(key.closeSound==="mechanical"?" selected":"")+'>Mechanical</option><option value="deep"'+(key.closeSound==="deep"?" selected":"")+'>Deep</option><option value="red"'+(key.closeSound==="red"?" selected":"")+'>Red Switch</option><option value="topre"'+(key.closeSound==="topre"?" selected":"")+'>Topre EC</option><option value="glass"'+(key.closeSound==="glass"?" selected":"")+'>Glass Tap</option><option value="bubble"'+(key.closeSound==="bubble"?" selected":"")+'>Bubble Pop</option><option value="blip"'+(key.closeSound==="blip"?" selected":"")+'>8-bit Blip</option><option value="spark"'+(key.closeSound==="spark"?" selected":"")+'>Electric Spark</option><option value="quit"'+(key.closeSound==="quit"?" selected":"")+'>Quit (Saw)</option></select>'+'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4((key.w||9.25)-0.25)+')">−</button><span>'+(key.w||9.25).toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4((key.w||9.25)+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4((key.h||3)-0.25)+')">−</button><span>'+(key.h||3).toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4((key.h||3)+0.25)+')">+</button></div></div></div>'+'<div class="br"><button class="btn-del" onclick="dkey()">Delete</button></div>';_addSndPreviews();return;}if(key&&key.action==="dock"){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Dock Panel</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Tap to launch, hold to quit</p></div>'+
'<label>&#x25CF; Bg Color</label><input type="color" value="'+(key.bgColor||key.color||"#1a1a2e")+'" oninput="upkLive(\'bgColor\',this.value)" onchange="upk(\'bgColor\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'+
'<label>&#x25D1; Bg Opacity</label><div style="margin:2px 0;display:flex;gap:4px;align-items:center"><input type=range min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:0.15)*100)+'" oninput="this.nextElementSibling.value=this.value" onchange="upk(\'bgOpacity\',parseInt(this.value)/100)"><input type=number min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:0.15)*100)+'" onchange="this.previousElementSibling.value=this.value;upk(\'bgOpacity\',parseInt(this.value)/100)" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+
'<label>&#x266B; Sound</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'">Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'">None</option><option value="click"'+(key.sound==="click"?" selected":"")+'">Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'">Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'">Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'">Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'">Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'">Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'">Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'">Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'">8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'">Electric Spark</option></select>'+
'<label>&#x266B; Quit Sound</label><select onchange="upk(\'quitSound\',this.value)"><option value=""'+(!key.quitSound?" selected":"")+'">Inherit</option><option value="none"'+(key.quitSound==="none"?" selected":"")+'">None</option><option value="click"'+(key.quitSound==="click"?" selected":"")+'">Click</option><option value="soft"'+(key.quitSound==="soft"?" selected":"")+'">Soft</option><option value="mechanical"'+(key.quitSound==="mechanical"?" selected":"")+'">Mechanical</option><option value="deep"'+(key.quitSound==="deep"?" selected":"")+'">Deep</option><option value="red"'+(key.quitSound==="red"?" selected":"")+'">Red Switch</option><option value="topre"'+(key.quitSound==="topre"?" selected":"")+'">Topre EC</option><option value="glass"'+(key.quitSound==="glass"?" selected":"")+'">Glass Tap</option><option value="bubble"'+(key.quitSound==="bubble"?" selected":"")+'">Bubble Pop</option><option value="blip"'+(key.quitSound==="blip"?" selected":"")+'">8-bit Blip</option><option value="spark"'+(key.quitSound==="spark"?" selected":"")+'">Electric Spark</option><option value="quit"'+(key.quitSound==="quit"?" selected":"")+'">Quit (Saw)</option></select>'+
'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4((key.w||4)-0.25)+')">−</button><span>'+(key.w||4).toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4((key.w||4)+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4((key.h||1.5)-0.25)+')">−</button><span>'+(key.h||1.5).toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4((key.h||1.5)+0.25)+')">+</button></div></div></div>'+
'<div class="br"><button class="btn-del" onclick="dkey()">Delete</button></div>';_addSndPreviews();return;}if(key&&key.action==="fullscreen"){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Fullscreen Toggle</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Tap to toggle iPad fullscreen</p></div>'+"<label>&#x25CF; Color</label><input type=\"color\" value=\""+(key.color||"#1a3a2a")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<div style=\"margin-top:10px;padding-top:8px;border-top:1px solid var(--border)\"><label style=\"font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block\">Display</label>"+"<select onchange=\"upkMode(this.value)\" style=\"margin:4px 0 6px;width:100%;padding:6px 8px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;font-size:12px\"><option value=\"label\""+(key.showIcon===false?" selected":"")+">Label only</option><option value=\"icon\""+(key.showIcon!==false&&key.showLabel===false?" selected":"")+">Icon only</option><option value=\"both\""+(key.showIcon!==false&&key.showLabel!==false?" selected":"")+">Label + Icon</option></select>"+"<label style=\"font-size:10px;color:var(--dim)\">Icon Size</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"var n=this.nextElementSibling;var v=parseInt(n.value)||20;v=Math.max(4,v-1);n.value=v;upk('iconSize',v)\">−</button><input type=\"number\" value=\""+(key.iconSize||20)+"\" onchange=\"upk('iconSize',parseInt(this.value))\" style=\"width:50px;text-align:center;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px;padding:2px 4px\"><button onclick=\"var n=this.previousElementSibling;var v=parseInt(n.value)||20;v=Math.min(80,v+1);n.value=v;upk('iconSize',v)\">+</button></div>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk(\'w\',"+_snap4((key.w||1.5)-0.25)+")\">−</button><span>"+(key.w||1.5).toFixed(2)+"</span><button onclick=\"upk(\'w\',"+_snap4((key.w||1.5)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk(\'h\',"+_snap4((key.h||1.25)-0.25)+")\">−</button><span>"+(key.h||1.25).toFixed(2)+"</span><button onclick=\"upk(\'h\',"+_snap4((key.h||1.25)+0.25)+")\">+</button></div></div></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addStyleBtns();return;}if(key&&key.action==="text-macro"){var _mt=key.macroText||"";document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Text Macro</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Tap to type recorded text</p></div>'+"<div style=\"margin:8px 0;padding:10px;background:var(--card);border-radius:6px;border:1px solid var(--border);min-height:48px\"><div style=\"font-size:12px;color:var(--text);white-space:pre-wrap;word-break:break-word;min-height:30px;max-height:120px;overflow-y:auto;margin-bottom:8px;font-family:monospace\">"+hesc(_mt||"(empty)")+"</div><div style=\"display:flex;gap:6px\"><button onclick=\"openTextMacroModal()\" style=\"flex:1;padding:8px;background:var(--accent);color:#1a1a1a;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px\">Edit</button>"+(_mt?"<button onclick=\"upk(\'macroText\',\'\');rpr()\" style=\"padding:8px 12px;background:transparent;color:var(--dim);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:12px\">Clear</button>":"")+"</div></div>"+"<label>Label</label><input value=\""+hesc(key.label||"Text Macro")+"\" oninput=\"upk(\'label\',this.value)\">"+"<label>&#x24D0; Text Color"+(key.fontColor?"":" <small style=\"color:var(--dim)\">(auto)</small>")+"</label><input type=\"color\" value=\""+(key.fontColor||"#e8e0d8")+"\" oninput=\"upkLive(\'fontColor\',this.value)\" onchange=\"upk(\'fontColor\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25CF; Background</label><input type=\"color\" value=\""+(key.color||"#1a2a1a")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x266B; Sound</label><select onchange=\"upk(\'sound\',this.value)\"><option value=\"\""+(!key.sound?" selected":"")+">Inherit</option><option value=\"none\""+(key.sound==="none"?" selected":"")+">None</option><option value=\"click\""+(key.sound==="click"?" selected":"")+">Click</option><option value=\"soft\""+(key.sound==="soft"?" selected":"")+">Soft</option><option value=\"mechanical\""+(key.sound==="mechanical"?" selected":"")+">Mechanical</option><option value=\"deep\""+(key.sound==="deep"?" selected":"")+">Deep</option><option value=\"red\""+(key.sound==="red"?" selected":"")+">Red Switch</option><option value=\"topre\""+(key.sound==="topre"?" selected":"")+">Topre EC</option><option value=\"glass\""+(key.sound==="glass"?" selected":"")+">Glass Tap</option><option value=\"bubble\""+(key.sound==="bubble"?" selected":"")+">Bubble Pop</option><option value=\"blip\""+(key.sound==="blip"?" selected":"")+">8-bit Blip</option><option value=\"spark\""+(key.sound==="spark"?" selected":"")+">Electric Spark</option></select>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk(\'w\',"+_snap4((key.w||4)-0.25)+")\">−</button><span>"+(key.w||4).toFixed(2)+"</span><button onclick=\"upk(\'w\',"+_snap4((key.w||4)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk(\'h\',"+_snap4((key.h||2.5)-0.25)+")\">−</button><span>"+(key.h||2.5).toFixed(2)+"</span><button onclick=\"upk(\'h\',"+_snap4((key.h||2.5)+0.25)+")\">+</button></div></div></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addSndPreviews();return;}if(key&&key.action==="mic-mute"){document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Mic Mute</label></div>'+"<label>&#x25CF; Button Bg</label><input type=\"color\" value=\""+(key.color||"#1a2a2a")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25D0; Mic Icon Color</label><input type=\"color\" value=\""+(key.micColor||"#999999")+"\" oninput=\"upkLive(\'micColor\',this.value)\" onchange=\"upk(\'micColor\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25CF; Level Color</label><input type=\"color\" value=\""+(key.micLevelColor||"#4ade80")+"\" oninput=\"upkLive(\'micLevelColor\',this.value)\" onchange=\"upk(\'micLevelColor\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label style=\"display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin:6px 0;padding:6px 8px;background:var(--card);border-radius:4px\"><input type=\"checkbox\" onchange=\"upk('showLevel',this.checked);fetch('/api/system/mic-monitor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:this.checked})})\" "+(key.showLevel?"checked":"")+" style=\"width:16px;height:16px\"><span>Show Mic Level</span></label>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addStyleBtns();return;}if(key&&key.action==="switch-profile"){var _tp=key.targetProfile||"";var _hp=key.holdProfile||"";document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Switch Profile</label></div>'+"<label>&#x1F446; Tap</label><select onchange=\"upk(\'targetProfile\',this.value)\"><option value=\"\">Select...</option>"+profiles.map(function(p){return"<option value=\""+hesc(p.filename)+"\""+(_tp===p.filename?" selected":"")+">"+hesc(p.profileName)+"</option>"}).join("")+"</select>"+"<label>&#x23F1; Long Press</label><select onchange=\"upk(\'holdProfile\',this.value)\"><option value=\"\">Select...</option>"+profiles.map(function(p){return"<option value=\""+hesc(p.filename)+"\""+(_hp===p.filename?" selected":"")+">"+hesc(p.profileName)+"</option>"}).join("")+"</select>"+"<label>&#x266B; Sound</label><select onchange=\"upk(\'sound\',this.value)\"><option value=\"\""+(!key.sound?" selected":"")+">Inherit</option><option value=\"none\""+(key.sound==="none"?" selected":"")+">None</option><option value=\"click\""+(key.sound==="click"?" selected":"")+">Click</option><option value=\"soft\""+(key.sound==="soft"?" selected":"")+">Soft</option><option value=\"mechanical\""+(key.sound==="mechanical"?" selected":"")+">Mechanical</option><option value=\"deep\""+(key.sound==="deep"?" selected":"")+">Deep</option><option value=\"red\""+(key.sound==="red"?" selected":"")+">Red Switch</option><option value=\"topre\""+(key.sound==="topre"?" selected":"")+">Topre EC</option><option value=\"glass\""+(key.sound==="glass"?" selected":"")+">Glass Tap</option><option value=\"bubble\""+(key.sound==="bubble"?" selected":"")+">Bubble Pop</option><option value=\"blip\""+(key.sound==="blip"?" selected":"")+">8-bit Blip</option><option value=\"spark\""+(key.sound==="spark"?" selected":"")+">Electric Spark</option></select>"+"<label>&#x25CF; Color</label><input type=\"color\" value=\""+(key.color||"#2a1a3a")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25D0; Icon Color</label><input type=\"color\" value=\""+(key.iconColor||"#a78bfa")+"\" oninput=\"upkLive(\'iconColor\',this.value)\" onchange=\"upk(\'iconColor\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<div style=\"margin-top:10px;padding-top:8px;border-top:1px solid var(--border)\"><label style=\"font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block\">Display</label>"+"<select onchange=\"upkMode(this.value)\" style=\"margin:4px 0 6px;width:100%;padding:6px 8px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;font-size:12px\"><option value=\"label\""+(key.showIcon===false?" selected":"")+">Label only</option><option value=\"icon\""+(key.showIcon!==false&&key.showLabel===false?" selected":"")+">Icon only</option><option value=\"both\""+(key.showIcon!==false&&key.showLabel!==false?" selected":"")+">Label + Icon</option></select>"+"<label style=\"font-size:10px;color:var(--dim)\">Icon Size</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"var n=this.nextElementSibling;var v=parseInt(n.value)||20;v=Math.max(4,v-1);n.value=v;upk('iconSize',v)\">−</button><input type=\"number\" value=\""+(key.iconSize||20)+"\" onchange=\"upk('iconSize',parseInt(this.value))\" style=\"width:50px;text-align:center;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px;padding:2px 4px\"><button onclick=\"var n=this.previousElementSibling;var v=parseInt(n.value)||20;v=Math.min(80,v+1);n.value=v;upk('iconSize',v)\">+</button></div>"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk(\'w\',"+_snap4((key.w||2)-0.25)+")\">−</button><span>"+(key.w||2).toFixed(2)+"</span><button onclick=\"upk(\'w\',"+_snap4((key.w||2)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk(\'h\',"+_snap4((key.h||1)-0.25)+")\">−</button><span>"+(key.h||1).toFixed(2)+"</span><button onclick=\"upk(\'h\',"+_snap4((key.h||1)+0.25)+")\">+</button></div></div></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";var _ss3=document.querySelectorAll("#pc select");for(var _i3=0;_i3<_ss3.length;_i3++){var _s3=_ss3[_i3];var _oc3=_s3.getAttribute("onchange")||"";if(_oc3.toLowerCase().indexOf("sound")<0)continue;var _b3=document.createElement("button");_b3.className="pv-btn";_b3.innerHTML="&#x25B6;";_b3.style.cssText="padding:4px 8px;font-size:12px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;margin-left:4px";_b3.onmouseover=function(){this.style.borderColor="var(--accent)"};_b3.onmouseout=function(){this.style.borderColor="var(--border)"};_b3.onclick=function(s){return function(e){e.preventDefault();e.stopPropagation();var v=s.value;if(!v||v===""){v=(profile&&profile.defaultSound)||"click"}if(v&&v!=="")testSnd(v)}}(_s3);_s3.parentNode.insertBefore(_b3,_s3.nextSibling)};_addStyleBtns();return;}if(key&&key.action==="volume"){var _lo2=key.layout||"horizontal";document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Volume Slider</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Tap = mute, Slide = volume</p></div>'+"<label>&#x260E; Layout</label><select onchange=\"upk(\'layout\',this.value)\"><option value=\"horizontal\""+(_lo2==="horizontal"?" selected":"")+">Horizontal</option><option value=\"vertical\""+(_lo2==="vertical"?" selected":"")+">Vertical</option></select>"+"<label>&#x25CF; Card Bg</label><input type=\"color\" value=\""+(key.color||"#1a2a2a")+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25D0; Icon Color</label><input type=\"color\" value=\""+(key.iconColor||"#999999")+"\" oninput=\"upkLive(\'iconColor\',this.value)\" onchange=\"upk(\'iconColor\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25CF; Bar Color</label><input type=\"color\" value=\""+(key.barColor||"#4ade80")+"\" oninput=\"upkLive(\'barColor\',this.value)\" onchange=\"upk(\'barColor\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<div class=\"rw\" style=\"margin-top:8px\"><div><label>&#x2194; Width</label><div class=\"stepper\"><button onclick=\"upk(\'w\',"+_snap4((key.w||3)-0.25)+")\">−</button><span>"+(key.w||3).toFixed(2)+"</span><button onclick=\"upk(\'w\',"+_snap4((key.w||3)+0.25)+")\">+</button></div></div><div><label>&#x2195; Height</label><div class=\"stepper\"><button onclick=\"upk(\'h\',"+_snap4((key.h||1)-0.25)+")\">−</button><span>"+(key.h||1).toFixed(2)+"</span><button onclick=\"upk(\'h\',"+_snap4((key.h||1)+0.25)+")\">+</button></div></div></div>"+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addStyleBtns();return;}if(key&&(key.action==="audio-in"||key.action==="audio-out")){var _isIn=key.action==="audio-in";var _ta=key.tapAction||"menu";var _ha=key.holdAction||"cycle";var _lbl=_isIn?"Audio In":"Audio Out";document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">'+_lbl+'</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Switch audio device</p></div>'+"<label>&#x25CF; Background</label><input type=\"color\" value=\""+(key.color||(_isIn?"#1a2a2a":"#1a1a2a"))+"\" oninput=\"upkLive(\'color\',this.value)\" onchange=\"upk(\'color\',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+'<label>&#x266B; Sound</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'>Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'>None</option><option value="click"'+(key.sound==="click"?" selected":"")+'>Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'>Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'>Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'>Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'>Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'>Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'>Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'>Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'>8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'>Electric Spark</option></select>'+"<label>&#x1F446; Tap Action</label><select onchange=\"upk(\'tapAction\',this.value)\"><option value=\"menu\""+(_ta==="menu"?" selected":"")+">Show Menu</option><option value=\"cycle\""+(_ta==="cycle"?" selected":"")+">Cycle Devices</option></select>"+"<label>&#x23F1; Hold Action</label><select onchange=\"upk(\'holdAction\',this.value)\"><option value=\"cycle\""+(_ha==="cycle"?" selected":"")+">Cycle Devices</option><option value=\"menu\""+(_ha==="menu"?" selected":"")+">Show Menu</option></select>"+'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4((key.w||3)-0.25)+')">−</button><span>'+(key.w||3).toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4((key.w||3)+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4((key.h||1)-0.25)+')">−</button><span>'+(key.h||1).toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4((key.h||1)+0.25)+')">+</button></div></div></div>'+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addSndPreviews();return;}if(key&&key.action==="ime-switch"){var _tapA=key.tapAction||"cycle";var _holdA=key.holdAction||"select";var _tapT=key.tapTarget||"";var _holdT=key.holdTarget||"";var _ims=window._imeList||[];var _tapOpts='<option value=""'+(_tapT===""?" selected":"")+'>Auto (first)</option>';var _holdOpts='<option value=""'+(_holdT===""?" selected":"")+'>Auto (first)</option>';for(var _imI=0;_imI<_ims.length;_imI++){var _im=_ims[_imI];var _imId=_im.id||"";var _imNm=hesc(_im.name||_imId);_tapOpts+='<option value="'+hesc(_imId)+'"'+(_tapT===_imId?" selected":"")+'>'+_imNm+'</option>';_holdOpts+='<option value="'+hesc(_imId)+'"'+(_holdT===_imId?" selected":"")+'>'+_imNm+'</option>'}document.getElementById("pc").innerHTML='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)"><label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Input Method</label><p style="font-size:10px;color:var(--dim);margin:4px 0">Switch macOS input method</p></div>'+"<label>&#x1F446; Tap Action</label><select onchange=\"upk('tapAction',this.value)\"><option value=\"cycle\""+(_tapA==="cycle"?" selected":"")+">Cycle IMEs</option><option value=\"select\""+(_tapA==="select"?" selected":"")+">Select IME</option></select>"+(_tapA==="select"?"<label>&#x1F3AF; Tap Target</label><select onchange=\"upk('tapTarget',this.value)\">"+_tapOpts+"</select>":"")+"<label>&#x23F1; Hold Action</label><select onchange=\"upk('holdAction',this.value)\"><option value=\"select\""+(_holdA==="select"?" selected":"")+">Select IME</option><option value=\"cycle\""+(_holdA==="cycle"?" selected":"")+">Cycle IMEs</option></select>"+(_holdA==="select"?"<label>&#x1F3AF; Hold Target</label><select onchange=\"upk('holdTarget',this.value)\">"+_holdOpts+"</select>":"")+"<label>&#x25CF; Background</label><input type=\"color\" value=\""+(key.color||"#1a2a3a")+"\" oninput=\"upkLive('color',this.value)\" onchange=\"upk('color',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x25D0; Icon Color</label><input type=\"color\" value=\""+(key.iconColor||"#4ade80")+"\" oninput=\"upkLive('iconColor',this.value)\" onchange=\"upk('iconColor',this.value)\" style=\"width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer\">"+"<label>&#x266B; Sound</label><select onchange=\"upk('sound',this.value)\"><option value=\"\""+(!key.sound?" selected":"")+">Inherit</option><option value=\"none\""+(key.sound==="none"?" selected":"")+">None</option><option value=\"click\""+(key.sound==="click"?" selected":"")+">Click</option><option value=\"soft\""+(key.sound==="soft"?" selected":"")+">Soft</option><option value=\"mechanical\""+(key.sound==="mechanical"?" selected":"")+">Mechanical</option><option value=\"deep\""+(key.sound==="deep"?" selected":"")+">Deep</option><option value=\"red\""+(key.sound==="red"?" selected":"")+">Red Switch</option><option value=\"topre\""+(key.sound==="topre"?" selected":"")+">Topre EC</option><option value=\"glass\""+(key.sound==="glass"?" selected":"")+">Glass Tap</option><option value=\"bubble\""+(key.sound==="bubble"?" selected":"")+">Bubble Pop</option><option value=\"blip\""+(key.sound==="blip"?" selected":"")+">8-bit Blip</option><option value=\"spark\""+(key.sound==="spark"?" selected":"")+">Electric Spark</option></select>"+'<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)"><label style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block">Display</label>'+"<select onchange=\"upkMode(this.value)\" style=\"margin:4px 0 6px;width:100%;padding:6px 8px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;font-size:12px\"><option value=\"label\""+(key.showIcon===false?" selected":"")+">Label only</option><option value=\"icon\""+(key.showIcon!==false&&key.showLabel===false?" selected":"")+">Icon only</option><option value=\"both\""+(key.showIcon!==false&&key.showLabel!==false?" selected":"")+">Label + Icon</option></select>"+"<label style=\"font-size:10px;color:var(--dim)\">Icon Size</label><div class=\"stepper\" style=\"margin:4px 0\"><button onclick=\"var n=this.nextElementSibling;var v=parseInt(n.value)||20;v=Math.max(4,v-1);n.value=v;upk('iconSize',v)\">−</button><input type=\"number\" value=\""+(key.iconSize||20)+"\" onchange=\"upk('iconSize',parseInt(this.value))\" style=\"width:50px;text-align:center;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:11px;padding:2px 4px\"><button onclick=\"var n=this.previousElementSibling;var v=parseInt(n.value)||20;v=Math.min(80,v+1);n.value=v;upk('iconSize',v)\">+</button></div>"+'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4((key.w||2)-0.25)+')">−</button><span>'+(key.w||2).toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4((key.w||2)+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4((key.h||1.25)-0.25)+')">−</button><span>'+(key.h||1.25).toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4((key.h||1.25)+0.25)+')">+</button></div></div></div>'+"<div class=\"br\"><button class=\"btn-del\" onclick=\"dkey()\">Delete</button></div>";_addSndPreviews();return;}
  if(!key){document.getElementById("pc").innerHTML='<p style="font-size:11px;color:var(--dim)">Click key to edit</p>';return}
  const kw=key.w||1,kh=key.h||1;
  document.getElementById("pc").innerHTML=
    '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">'+
    '<label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Function</label>'+
    (key.kb?
    '<label>&#x2699; Keyboard Key</label>'+
    '<div style="margin:8px 0;padding:10px;background:var(--card);border-radius:6px;border:1px solid var(--border)"><div style="font-size:13px;color:var(--text);font-family:monospace;margin-bottom:4px">'+hesc(key.label||key.key)+'</div>'+
    '<div style="font-size:11px;color:var(--dim);margin-bottom:8px;line-height:1.5">'+(key.shiftLabel?('Hold Shift shows '+hesc(key.shiftLabel)+' · sends '+hesc(key.value||key.key)):('Function key · sends '+hesc(key.value||key.key)+' · '+(key.action==="hold"?"Hold":"Tap")))+'</div>'+
    '<button onclick="openKbPicker(\'change\')" style="width:100%;padding:8px;background:var(--accent);color:#1a1a1a;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px">Change Key</button></div>'
    :
    '<label>&#x2699; Key Binding</label>'+
    '<div style="margin:8px 0;padding:10px;background:var(--card);border-radius:6px;border:1px solid var(--border);min-height:48px"><div style="font-size:12px;color:var(--text);white-space:pre-wrap;word-break:break-word;min-height:30px;max-height:120px;overflow-y:auto;margin-bottom:8px;font-family:monospace">'+hesc(key.value||"(empty)")+'</div><div style="display:flex;gap:6px"><button onclick="openMM(' + "'" + selKey + "'" + ')" style="flex:1;padding:8px;background:var(--accent);color:#1a1a1a;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:12px">Edit</button>'+(key.value?'<button onclick="upk(\'value\',\'\');rpr()" style="padding:8px 12px;background:transparent;color:var(--dim);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:12px">Clear</button>':"")+'</div></div>'
    )+
    '</div>'+
    '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">'+
    '<label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Style</label>'+
    '<label>&#x25C6; Label</label><input value="'+hesc(key.label)+'" oninput="upk(\'label\',this.value)">'+
    '<label>&#x24D0; Font Color'+(key.fontColor?'':' <small style="color:var(--dim)">(auto)</small>')+'</label><input type="color" value="'+(key.fontColor||"#e8e0d8")+'" oninput="upkLive(\'fontColor\',this.value)" onchange="upk(\'fontColor\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'+
    '<label>&#x25CF; Color</label><input type="color" value="'+(key.color||"#0f3460")+'" oninput="upkLive(\'color\',this.value)" onchange="upk(\'color\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'+
    '<label>&#x25D1; Bg Opacity</label><div style="margin:2px 0;display:flex;gap:4px;align-items:center"><input type=range min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:1.0)*100)+'" oninput="upkLive(\'bgOpacity\',parseInt(this.value)/100);this.nextElementSibling.value=this.value" onchange="upk(\'bgOpacity\',parseInt(this.value)/100)"><input type=number min=0 max=100 value="'+((key.bgOpacity!==undefined?key.bgOpacity:1.0)*100)+'" onchange="this.previousElementSibling.value=this.value;upk(\'bgOpacity\',parseInt(this.value)/100)" style="width:40px;padding:2px 4px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:3px;font-size:10px;text-align:center"></div>'+
    (key.icon
      ? '<label>&#x263A; Icon</label><div style="display:flex;align-items:center;gap:8px;margin:2px 0 6px">'
        +'<div style="width:34px;height:34px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;background:var(--bg);border:1px solid var(--border);border-radius:4px;color:'+(key.iconColor||"#ffffff")+'">'+((window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.svg[key.icon])||"").replace('<svg ','<svg style="width:70%;height:70%;display:block" ')+'</div>'
        +'<div style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0">'
        +'<button onclick="openIconPicker()" style="display:block;width:100%;padding:5px 8px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:11px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">&#x270E; Change: '+hesc(key.icon)+'</button>'
        +'<button onclick="upkClearIcon()" style="display:block;width:100%;padding:5px 8px;background:transparent;color:var(--dim);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:11px;text-align:left">&#x2715; Remove icon</button>'
        +'</div></div>'
        +'<label>&#x25D0; Icon Color</label><input type="color" value="'+(key.iconColor||"#ffffff")+'" oninput="upkLive(\'iconColor\',this.value)" onchange="upk(\'iconColor\',this.value)" style="width:30px;height:30px;padding:0;border:1px solid var(--border);border-radius:3px;cursor:pointer">'
      : '<button onclick="openIconPicker()" style="margin:8px 0 0;display:block;width:100%;padding:8px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;font-size:12px;text-align:left">&#x2699; Set & pick icon</button>')+
    '<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)"><label style="font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block">Display</label>'+
    '<select onchange="upkMode(this.value)" style="margin:4px 0 6px;width:100%;padding:6px 8px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;font-size:12px"><option value="label"'+(key.showIcon!==true?" selected":"")+'>Label only</option><option value="icon"'+(key.icon?"":' disabled')+(key.showIcon===true&&key.showLabel===false?" selected":"")+'>Icon only</option><option value="both"'+(key.icon?"":' disabled')+(key.showIcon===true&&key.showLabel!==false?" selected":"")+'>Label + Icon</option></select>'+
    
    '</div>'+
    '<div style="margin-bottom:8px">'+
    '<label style="color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:1px">Sound &amp; Size</label>'+
    '<label>&#x266B; Sound</label><select onchange="upk(\'sound\',this.value)"><option value=""'+(!key.sound?" selected":"")+'>Inherit</option><option value="none"'+(key.sound==="none"?" selected":"")+'>None</option><option value="click"'+(key.sound==="click"?" selected":"")+'>Click</option><option value="soft"'+(key.sound==="soft"?" selected":"")+'>Soft</option><option value="mechanical"'+(key.sound==="mechanical"?" selected":"")+'>Mechanical</option><option value="deep"'+(key.sound==="deep"?" selected":"")+'>Deep</option><option value="red"'+(key.sound==="red"?" selected":"")+'>Red Switch</option><option value="topre"'+(key.sound==="topre"?" selected":"")+'>Topre EC</option><option value="glass"'+(key.sound==="glass"?" selected":"")+'>Glass Tap</option><option value="bubble"'+(key.sound==="bubble"?" selected":"")+'>Bubble Pop</option><option value="blip"'+(key.sound==="blip"?" selected":"")+'>8-bit Blip</option><option value="spark"'+(key.sound==="spark"?" selected":"")+'>Electric Spark</option></select>'+(key.action==="dock"?'<label>&#x266B; Quit Sound</label><select onchange="upk(\'quitSound\',this.value)"><option value=""' + (!key.quitSound ? " selected" : "") + '>Inherit</option><option value="none"' + (key.quitSound === "none" ? " selected" : "") + '>None</option><option value="click"' + (key.quitSound === "click" ? " selected" : "") + '>Click</option><option value="soft"' + (key.quitSound === "soft" ? " selected" : "") + '>Soft</option><option value="mechanical"' + (key.quitSound === "mechanical" ? " selected" : "") + '>Mechanical</option><option value="deep"' + (key.quitSound === "deep" ? " selected" : "") + '>Deep</option><option value="red"' + (key.quitSound === "red" ? " selected" : "") + '>Red Switch</option><option value="topre"' + (key.quitSound === "topre" ? " selected" : "") + '>Topre EC</option><option value="glass"' + (key.quitSound === "glass" ? " selected" : "") + '>Glass Tap</option><option value="bubble"' + (key.quitSound === "bubble" ? " selected" : "") + '>Bubble Pop</option><option value="blip"' + (key.quitSound === "blip" ? " selected" : "") + '>8-bit Blip</option><option value="spark"' + (key.quitSound === "spark" ? " selected" : "") + '>Electric Spark</option><option value="quit"' + (key.quitSound === "quit" ? " selected" : "") + '>Quit (Saw)</option></select>'+
    '':"")+'<div class="rw" style="margin-top:8px"><div><label>&#x2194; Width</label><div class="stepper"><button onclick="upk(\'w\','+_snap4(kw-0.25)+')">\u2212</button><span>'+kw.toFixed(2)+'</span><button onclick="upk(\'w\','+_snap4(kw+0.25)+')">+</button></div></div><div><label>&#x2195; Height</label><div class="stepper"><button onclick="upk(\'h\','+_snap4(kh-0.25)+')">\u2212</button><span>'+kh.toFixed(2)+'</span><button onclick="upk(\'h\','+_snap4(kh+0.25)+')">+</button></div></div></div>'+
    '<div class="br"><button class="btn-del" onclick="dkey()">Delete</button></div>';
_addStyleBtns();
var _ss=document.querySelectorAll("#pc select");for(var _i=0;_i<_ss.length;_i++){var _sel=_ss[_i];var _oc=_sel.getAttribute("onchange")||"";if(_oc.toLowerCase().indexOf("sound")<0)continue;var _b=document.createElement("button");_b.className="pv-btn";_b.innerHTML="&#x25B6;";_b.style.cssText="padding:4px 8px;font-size:12px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;margin-left:4px";_b.title="Preview";_b.onmouseover=function(){this.style.borderColor="var(--accent)"};_b.onmouseout=function(){this.style.borderColor="var(--border)"};_b.onclick=function(s){return function(e){e.preventDefault();e.stopPropagation();var v=s.value;if(!v||v===""){v=(profile&&profile.defaultSound)||"click"}if(v&&v!=="")testSnd(v)}}(_sel);_sel.parentNode.insertBefore(_b,_sel.nextSibling)}}


var _liveBase=null;
function upkLive(prop,val){
  const key=cp_()?.keys.find(k=>k.id===selKey);if(!key)return;
  if(!_liveBase||_liveBase.kid!==key.id||_liveBase.prop!==prop){_liveBase={kid:key.id,prop:prop,before:[_snapshot(key)]}}
  key[prop]=val;_setDirty();rr();
}

function upkLiveGroup(prop,val){
  const page=cp_();if(!page)return;
  if(!_liveBase||_liveBase.kid!=="*"||_liveBase.prop!==prop){_liveBase={kid:"*",prop:prop,before:page.keys.filter(function(k){return selKeys.has(k.id)}).map(function(k){return _snapshot(k)})}}
  selKeys.forEach(function(kid){
    var k=page.keys.find(function(x){return x.id===kid});
    if(k)k[prop]=val;
  });
  _setDirty();rr();
}
function upk(prop,val){const key=cp_()?.keys.find(k=>k.id===selKey);if(!key)return;var before=_snapshot(key);if(_liveBase&&_liveBase.kid===key.id&&_liveBase.prop===prop){before=_liveBase.before[0];_liveBase=null}if(prop==="w"||prop==="h")val=Math.max(0.25,_snap4(parseFloat(val)||1));key[prop]=val;if(prop==="targetProfile"){var p=profiles.find(function(x){return x.filename===val});key.label=p?p.profileName:"Switch Profile"}_setDirty();if(JSON.stringify(before)!==JSON.stringify(_snapshot(key))){_pushUndo([before])}rr();if(prop!=='label')rpr()}
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
  _pushUndo(before);_setDirty();rr();rpr();
}
function upkGroup(prop,val){const page=cp_();if(!page)return;var before=page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k));if(_liveBase&&_liveBase.kid==="*"&&_liveBase.prop===prop){before=_liveBase.before;_liveBase=null}selKeys.forEach(kid=>{const k=page.keys.find(x=>x.id===kid);if(k){if(prop==="w"||prop==="h")val=Math.max(0.25,_snap4(parseFloat(val)||1));k[prop]=val}});if(JSON.stringify(before)!==JSON.stringify(page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k)))){_pushUndo(before)}_setDirty();rr();rpr();}


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
let _tmModalKey=null;let _tmModalText="";
function openTextMacroModal(){if(!selKey)return;var kid=selKey;var k=cp_()?.keys.find(function(x){return x.id===kid});if(!k)return;_tmModalKey=kid;_tmModalText=k.macroText||"";captureMode=false;_showModal("textMacroModal");var lbl=document.getElementById("tmModalKeyLabel");if(lbl)lbl.textContent=k.label||"Text Macro";var ta=document.getElementById("tmModalTextArea");if(ta){ta.value=_tmModalText;ta.focus()}}
function closeTextMacroModal(save){var ta=document.getElementById("tmModalTextArea");if(ta)_tmModalText=ta.value;if(save&&_tmModalKey){var k=cp_()?.keys.find(function(x){return x.id===_tmModalKey});if(k){var b=_snapshot(k);k.macroText=_tmModalText;if(JSON.stringify(b)!==JSON.stringify(_snapshot(k))){_setDirty()}}}_hideModal("textMacroModal");_tmModalKey=null;_tmModalText="";rr();rpr()}
function tmClearText(){var ta=document.getElementById("tmModalTextArea");if(ta){ta.value="";ta.focus()}}
var _apiKeyModalKey=null;var _apiKeyModalFn=null;
function openApiKeyModal(){if(!selKey)return;var kid=selKey;var k=cp_()?.keys.find(function(x){return x.id===kid});if(!k)return;_apiKeyModalKey=kid;_apiKeyModalFn=activeProfile||"Default.json";var inp=document.getElementById("apiKeyModalInput");inp.value="";var hint=document.getElementById("apiKeyModalHint");if(k.hasApiKey||k.apiKey){hint.innerHTML='<span style="color:#4ade80">✓ API key is already configured.</span> Enter a new one to replace it, or cancel to keep the current one.'}else{hint.innerHTML='<span style="color:#f59e0b">✗ No API key set.</span> Enter your DeepSeek API key below.'}_showModal("apiKeyModal");setTimeout(function(){inp.focus()},100)}
function closeApiKeyModal(){_hideModal("apiKeyModal");_apiKeyModalKey=null;_apiKeyModalFn=null}
function saveApiKey(){var v=document.getElementById("apiKeyModalInput").value.trim();if(!v){var msg=document.getElementById("apiKeyModalMsg");msg.textContent="Please enter an API key.";msg.style.color="#f87171";return}if(!_apiKeyModalKey||!_apiKeyModalFn){closeApiKeyModal();return}function _doSaveApiKey(){fetch("/api/profiles/"+encodeURIComponent(_apiKeyModalFn)+"/keys/"+encodeURIComponent(_apiKeyModalKey)+"/api-key",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({apiKey:v})}).then(function(r){if(!r.ok)throw new Error("save failed");return r.json()}).then(function(){var k=cp_()?.keys.find(function(x){return x.id===_apiKeyModalKey});if(k){k.hasApiKey=true;var b=_snapshot(k);delete k.apiKey;if(JSON.stringify(b)!==JSON.stringify(_snapshot(k))){_setDirty()}}rpr();closeApiKeyModal()}).catch(function(e){var msg=document.getElementById("apiKeyModalMsg");msg.textContent="Failed to save API key. Check server connection.";msg.style.color="#f87171"})}if(dirty){saveProfile().then(function(){_doSaveApiKey()})}else{_doSaveApiKey()}}
var _ipTab="";
function upkMode(m){var k=cp_()?.keys.find(function(x){return x.id===selKey});if(!k)return;var before=_snapshot(k);if(m==="icon"){k.showIcon=true;k.showLabel=false}else if(m==="both"){k.showIcon=true;delete k.showLabel}else{k.showIcon=false;delete k.showLabel}_setDirty();if(JSON.stringify(before)!==JSON.stringify(_snapshot(k))){_pushUndo([before])}rr();rpr()}
function openIconPicker(){if(!selKey)return;var k=cp_()?.keys.find(function(x){return x.id===selKey});if(!k)return;var _gs=window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.groups||[];var _tgt=_ipTab;if(k.icon){for(var _gi=0;_gi<_gs.length;_gi++){if(_gs[_gi].icons.indexOf(k.icon)>=0){_tgt=_gs[_gi].id;break}}}if(!_tgt&&_gs.length)_tgt=_gs[0].id;var _sf=document.getElementById("ipSearch");if(_sf)_sf.value="";_ipTab=_tgt;iconPickerTab(_tgt);_showModal("iconPicker")}
function closeIconPicker(){_hideModal("iconPicker")}
function iconPickerTab(t){_ipTab=t;var gs=(window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.groups)||[];var tb=document.getElementById("ipTabs");tb.innerHTML=gs.map(function(g){return '<button onclick="iconPickerTab(\''+g.id+'\')" style="padding:5px 10px;border-radius:4px;border:1px solid '+(g.id===t?'var(--accent)':'var(--border)')+';background:'+(g.id===t?'var(--accent)':'transparent')+';color:'+(g.id===t?'#1a1a1a':'var(--dim)')+';cursor:pointer;font-size:11px">'+hesc(g.label)+'</button>'}).join("");var gr=gs.find(function(g){return g.id===t});var k=cp_()?.keys.find(function(x){return x.id===selKey});var cur=(k&&k.icon)||"";var grid=document.getElementById("ipGrid");if(!gr){grid.innerHTML="";return}grid.innerHTML=gr.icons.map(function(n){return _ipCell(n,cur)}).join("")}
function pickIcon(n){var k=cp_()?.keys.find(function(x){return x.id===selKey});if(!k)return;var before=_snapshot(k);k.icon=n;if(k.showIcon!==true)k.showIcon=true;_setDirty();if(JSON.stringify(before)!==JSON.stringify(_snapshot(k))){_pushUndo([before])}rr();rpr();iconPickerTab(_ipTab)}
function upkClearIcon(){if(!selKey)return;var k=cp_()?.keys.find(function(x){return x.id===selKey});if(!k||!k.icon)return;var before=_snapshot(k);delete k.icon;k.showIcon=false;delete k.showLabel;_setDirty();if(JSON.stringify(before)!==JSON.stringify(_snapshot(k))){_pushUndo([before])}rr();rpr()}
function _ipCell(n,cur){var svg=(window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.svg[n])||"";return '<button title="'+n+'" onclick="pickIcon(\''+n+'\')" style="width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:'+(n===cur?'var(--accent)':'var(--card)')+';border:1px solid '+(n===cur?'var(--accent)':'var(--border)')+';border-radius:6px;cursor:pointer;padding:6px;color:'+(n===cur?'#1a1a1a':'var(--text)')+'">'+svg.replace("<svg ","<svg style=\"width:70%;height:70%;display:block\" ")+'</button>'}
function iconPickerSearch(q){q=(q||"").toLowerCase().trim();var gs=(window.TAPFLOW_ICONS&&window.TAPFLOW_ICONS.groups)||[];var k=cp_()?.keys.find(function(x){return x.id===selKey});var cur=(k&&k.icon)||"";var tb=document.getElementById("ipTabs");var grid=document.getElementById("ipGrid");if(!q){tb.style.display="flex";iconPickerTab(_ipTab);return}tb.style.display="none";var all=[];gs.forEach(function(g){g.icons.forEach(function(n){if(all.indexOf(n)<0)all.push(n)})});var hits=all.filter(function(n){return n.toLowerCase().indexOf(q)>=0});grid.innerHTML=hits.map(function(n){return _ipCell(n,cur)}).join("")||'<div style="color:var(--dim);font-size:12px;padding:20px;text-align:center">No matches</div>'}
function openProfileManager(){_showModal("profileManagerModal");pmRender();}
function importDefaults(){var el=document.getElementById("defProfiles");if(!el)return;el.style.display="block";el.innerHTML='Loading...';fetch("/api/bundled-profiles").then(function(r){return r.json()}).then(function(d){var list=d.profiles||[];if(!list.length){el.innerHTML="No default profiles found";return}el.innerHTML=list.map(function(p){return'<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;margin:3px 0;border-radius:6px;background:var(--card);border:1px solid var(--border)"><span style="flex:1;text-align:left">'+hesc(p.profileName)+' <span style="color:var(--dim);font-size:10px">('+p.keyCount+' keys)</span></span><button onclick="importOneDefault("+hesc(JSON.stringify(p.filename))+")" style="padding:4px 12px;font-size:11px;background:var(--accent);color:#1a1a1a;border:none;border-radius:4px;cursor:pointer;font-weight:600">Import</button></div>'}).join("")}).catch(function(){el.innerHTML="Failed to load defaults"})}
function importOneDefault(fn){t("Importing...");fetch("/api/bundled-profiles/"+encodeURIComponent(fn),{method:"POST"}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){if(!x.ok){t("Import failed");return}t("Imported: "+fn);lpl().then(function(){if(x.d.filename){lp(x.d.filename)}})})}
function pmRender(){var el=document.getElementById("pmList");el.innerHTML=profiles.map(function(p,i){return"<div style=\"display:flex;align-items:center;gap:8px;padding:8px 10px;margin:3px 0;border-radius:6px;background:#272421\"><input value=\""+hesc(p.profileName)+"\" data-fn=\""+hesc(p.filename)+"\" onkeydown=\"if(event.key==='Enter'){var fn=this.getAttribute('data-fn');var nm=this.value;if(fn&&nm)pmRename(fn,nm)}\" style=\"flex:1;padding:5px 8px;background:#151210;color:#e8e0d8;border:1px solid rgba(255,255,255,0.05);border-radius:4px;font-size:12px\"><button onclick=\"dp("+hesc(JSON.stringify(p.filename))+").then(function(){pmRender()})\" style=\"padding:4px 10px;font-size:11px;background:#5c3028;color:#e8e0d8;border:none;border-radius:4px;cursor:pointer;font-weight:600\">X</button></div>"}).join("");}
function pmConfirm(fn,btn){var row=btn.parentElement;var inp=row.querySelector("input");var nm=inp?inp.value:"";if(!nm||!fn)return;pmRename(fn,nm)}

function pmRename(fn,nm){if(!nm)return;fetch("/api/profiles/"+encodeURIComponent(fn),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileName:nm})}).then(function(r){return r.json()}).then(function(){if(fn===activeProfile&&profile){profile.profileName=nm;rpgl()}lpl();setTimeout(pmRender,200)})}
function pmCreate(){var p={profileName:"New Profile",version:"1.0",device:"iPad 11\"",deviceWidth:1194,deviceHeight:834,dpr:2,topInset:32,cellSize:60,gap:0,canvasX:0,canvasY:0,defaultSound:"click",windowRules:[],pages:[{id:"main",label:"Main",keys:[]}],groups:[]};fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)}).then(function(r){return r.json()}).then(function(d){if(d.filename){lpl();lp(d.filename)}})}
function pmExpSel(el){var dlg=document.getElementById("pmExpDlg");if(!dlg)return;dlg.querySelectorAll(".exp-it").forEach(function(d){d.style.borderColor="var(--border)";d.style.background="var(--card)"});el.style.borderColor="var(--accent)";el.style.background="#33302c";dlg._selFn=el.getAttribute("data-fn");var go=document.getElementById("pmExpGo");go.disabled=false;go.style.opacity="1";go.style.cursor="pointer"}
function pmExpGo(){var dlg=document.getElementById("pmExpDlg");if(!dlg||!dlg._selFn)return;pmExport(dlg._selFn);dlg.remove()}
function pmExportDialog(){var old=document.getElementById("pmExpDlg");if(old)old.remove();var ov=document.createElement("div");ov.id="pmExpDlg";ov.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:300;display:flex;align-items:center;justify-content:center";ov.onclick=function(e){if(e.target===ov)ov.remove()};var box=document.createElement("div");box.style.cssText="background:var(--panel);padding:20px;border-radius:8px;border:1px solid var(--accent);width:320px;max-height:70vh;overflow:auto";box.innerHTML='<style>#pmExpDlg .exp-it:hover{background:#33302c!important;transform:translateY(-1px)}</style>'+'<h3 style="margin-bottom:12px">\u9009\u62e9\u8981\u5bfc\u51fa\u7684 Profile</h3>'+(profiles||[]).map(function(p){return '<div class="exp-it" data-fn="'+hesc(p.filename)+'" onclick="pmExpSel(this)" style="cursor:pointer;padding:8px 10px;margin:4px 0;border-radius:6px;border:2px solid var(--border);background:var(--card);transition:all 0.15s">'+hesc(p.profileName)+'</div>'}).join('')+'<div style="display:flex;gap:8px;margin-top:14px">'+'<button onclick="document.getElementById(\'pmExpDlg\').remove()" style="flex:1;padding:8px;background:transparent;color:var(--dim);border:1px solid var(--border);border-radius:6px;cursor:pointer">\u53d6\u6d88</button>'+'<button id="pmExpGo" onclick="pmExpGo()" disabled style="flex:1;padding:8px;background:var(--accent);color:#1a1a1a;border:none;border-radius:6px;cursor:default;font-weight:600;opacity:0.4">\u5bfc\u51fa</button></div>';ov.appendChild(box);document.body.appendChild(ov);var cur=ov.querySelector(".exp-it[data-fn=\""+CSS.escape(activeProfile)+"\"]");if(cur)pmExpSel(cur)}
function pmExport(fn){fetch("/api/profiles/"+encodeURIComponent(fn)).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(p){var nm=(p.profileName||fn.replace(/\.json$/,""));var blob=new Blob([JSON.stringify(p,function(key,val){if((key==="apiKey"||key==="hasApiKey")&&this.action==="balance")return undefined;return val},2)],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nm+".json";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1000);t("Exported: "+nm)}).catch(function(){t("Export failed")})}
function pmImport(){document.getElementById("pmImpF").click()}
function pmImportGo(inp){var f=inp.files&&inp.files[0];inp.value="";if(!f)return;var rd=new FileReader();rd.onload=function(){var data;try{data=JSON.parse(rd.result)}catch(e){t("Import failed: not valid JSON");return}
fetch("/api/profiles/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){if(!x.ok){t("Import failed: "+((x.d&&x.d.detail)||"server error"));return}
t("Imported: "+x.d.profileName);lpl().then(function(){if(x.d.filename){lp(x.d.filename)}setTimeout(pmRender,200)})}).catch(function(){t("Import failed")})};rd.onerror=function(){t("Import failed: cannot read file")};rd.readAsText(f)}
function copyStyle(){if(!selKey&&selKeys.size===0)return;var k;if(selKey){k=cp_()?.keys.find(function(x){return x.id===selKey})}else{var page=cp_();if(!page)return;var keys=page.keys.filter(function(k){return selKeys.has(k.id)});if(!keys.length)return;k=keys[0]}if(!k)return;copiedStyle={color:k.color,sound:k.sound};_refreshStyleBtns();t("Style copied")}
function pasteStyle(){if(!copiedStyle)return;var page=cp_();if(!page)return;var targets;if(selKeys.size>0){targets=page.keys.filter(function(k){return selKeys.has(k.id)})}else if(selKey){targets=[page.keys.find(function(k){return k.id===selKey})]}else{return}if(!targets.length)return;var snapshots=targets.map(function(k){return _snapshot(k)});targets.forEach(function(k){if(copiedStyle.color!==undefined)k.color=copiedStyle.color;if(copiedStyle.sound!==undefined)k.sound=copiedStyle.sound});_pushUndo(snapshots);_setDirty();rr();rpr();t("Style pasted")}
function delSelected(){if(!confirm("Delete "+selKeys.size+" keys?"))return;const page=cp_();if(!page)return;const before=page.keys.filter(k=>selKeys.has(k.id)).map(k=>_snapshot(k));page.keys=page.keys.filter(k=>!selKeys.has(k.id));_pushUndo(before);selKeys.clear();selKey=null;_setDirty();renderAll();}

// ── Keyboard keys (two-state, ANSI widths, Mac-adapted) ──
var KB_KEYS={
 esc:{key:"ESCAPE",label:"esc",action:"turbo",w:1},
 grave:{key:"`",label:"`",shiftLabel:"~",action:"turbo",w:1},
 "1":{key:"1",label:"1",shiftLabel:"!",action:"turbo",w:1},
 "2":{key:"2",label:"2",shiftLabel:"@",action:"turbo",w:1},
 "3":{key:"3",label:"3",shiftLabel:"#",action:"turbo",w:1},
 "4":{key:"4",label:"4",shiftLabel:"$",action:"turbo",w:1},
 "5":{key:"5",label:"5",shiftLabel:"%",action:"turbo",w:1},
 "6":{key:"6",label:"6",shiftLabel:"^",action:"turbo",w:1},
 "7":{key:"7",label:"7",shiftLabel:"&",action:"turbo",w:1},
 "8":{key:"8",label:"8",shiftLabel:"*",action:"turbo",w:1},
 "9":{key:"9",label:"9",shiftLabel:"(",action:"turbo",w:1},
 "0":{key:"0",label:"0",shiftLabel:")",action:"turbo",w:1},
 minus:{key:"-",label:"-",shiftLabel:"_",action:"turbo",w:1},
 equal:{key:"=",label:"=",shiftLabel:"+",action:"turbo",w:1},
 backspace:{key:"DELETE",label:"delete",action:"turbo",w:2},
 tab:{key:"TAB",label:"tab",action:"turbo",w:1.5},
 q:{key:"Q",label:"q",shiftLabel:"Q",action:"turbo",w:1},
 w:{key:"W",label:"w",shiftLabel:"W",action:"turbo",w:1},
 e:{key:"E",label:"e",shiftLabel:"E",action:"turbo",w:1},
 r:{key:"R",label:"r",shiftLabel:"R",action:"turbo",w:1},
 t:{key:"T",label:"t",shiftLabel:"T",action:"turbo",w:1},
 y:{key:"Y",label:"y",shiftLabel:"Y",action:"turbo",w:1},
 u:{key:"U",label:"u",shiftLabel:"U",action:"turbo",w:1},
 i:{key:"I",label:"i",shiftLabel:"I",action:"turbo",w:1},
 o:{key:"O",label:"o",shiftLabel:"O",action:"turbo",w:1},
 p:{key:"P",label:"p",shiftLabel:"P",action:"turbo",w:1},
 lbracket:{key:"[",label:"[",shiftLabel:"{",action:"turbo",w:1},
 rbracket:{key:"]",label:"]",shiftLabel:"}",action:"turbo",w:1},
 bslash:{key:"\\",label:"\\",shiftLabel:"|",action:"turbo",w:1.5},
 caps:{key:"CAPSLOCK",label:"caps",action:"hold",w:1.75},
 a:{key:"A",label:"a",shiftLabel:"A",action:"turbo",w:1},
 s:{key:"S",label:"s",shiftLabel:"S",action:"turbo",w:1},
 d:{key:"D",label:"d",shiftLabel:"D",action:"turbo",w:1},
 f:{key:"F",label:"f",shiftLabel:"F",action:"turbo",w:1},
 g:{key:"G",label:"g",shiftLabel:"G",action:"turbo",w:1},
 h:{key:"H",label:"h",shiftLabel:"H",action:"turbo",w:1},
 j:{key:"J",label:"j",shiftLabel:"J",action:"turbo",w:1},
 k:{key:"K",label:"k",shiftLabel:"K",action:"turbo",w:1},
 l:{key:"L",label:"l",shiftLabel:"L",action:"turbo",w:1},
 semicolon:{key:";",label:";",shiftLabel:":",action:"turbo",w:1},
 quote:{key:"'",label:"'",shiftLabel:'"',action:"turbo",w:1},
 return:{key:"RETURN",label:"return",action:"turbo",w:2.25},
 lshift:{key:"SHIFT",label:"shift",action:"hold",w:2.25},
 z:{key:"Z",label:"z",shiftLabel:"Z",action:"turbo",w:1},
 x:{key:"X",label:"x",shiftLabel:"X",action:"turbo",w:1},
 c:{key:"C",label:"c",shiftLabel:"C",action:"turbo",w:1},
 v:{key:"V",label:"v",shiftLabel:"V",action:"turbo",w:1},
 b:{key:"B",label:"b",shiftLabel:"B",action:"turbo",w:1},
 n:{key:"N",label:"n",shiftLabel:"N",action:"turbo",w:1},
 m:{key:"M",label:"m",shiftLabel:"M",action:"turbo",w:1},
 comma:{key:",",label:",",shiftLabel:"<",action:"turbo",w:1},
 period:{key:".",label:".",shiftLabel:">",action:"turbo",w:1},
 slash:{key:"/",label:"/",shiftLabel:"?",action:"turbo",w:1},
 rshift:{key:"SHIFT",label:"shift",action:"hold",w:2.75},
 fn:{key:"FN",label:"fn",action:"turbo",w:1},
 ctrl:{key:"CONTROL",label:"⌃",action:"hold",w:1.25},
 opt:{key:"OPTION",label:"⌥",action:"hold",w:1.25},
 cmd:{key:"COMMAND",label:"⌘",action:"hold",w:1.25},rcmd:{key:"COMMAND",label:"⌘",action:"hold",w:1.5},ropt:{key:"OPTION",label:"⌥",action:"hold",w:1.5},rmacro:{key:"CONTROL",label:"⌃",action:"macro",w:1.5},
 space:{key:"SPACE",label:"",action:"turbo",w:6.25},
 left:{key:"LEFT",label:"←",action:"turbo",w:1},
 down:{key:"DOWN",label:"↓",action:"turbo",w:1},
 up:{key:"UP",label:"↑",action:"turbo",w:1},
 right:{key:"RIGHT",label:"→",action:"turbo",w:1},
 home:{key:"HOME",label:"home",action:"turbo",w:1},
 end:{key:"END",label:"end",action:"turbo",w:1},
 pgup:{key:"PAGEUP",label:"pgup",action:"turbo",w:1},
 pgdn:{key:"PAGEDOWN",label:"pgdn",action:"turbo",w:1},
 fwddel:{key:"FWD_DELETE",label:"del",action:"turbo",w:1},
 insert:{key:"HELP",label:"ins",action:"turbo",w:1},
 prtsc:{key:"F13",label:"prtsc",action:"turbo",w:1},scrlk:{key:"F14",label:"scrlk",action:"turbo",w:1},pause:{key:"F15",label:"pause",action:"turbo",w:1},
 f1:{key:"F1",label:"F1",action:"turbo",w:1},f2:{key:"F2",label:"F2",action:"turbo",w:1},f3:{key:"F3",label:"F3",action:"turbo",w:1},f4:{key:"F4",label:"F4",action:"turbo",w:1},f5:{key:"F5",label:"F5",action:"turbo",w:1},f6:{key:"F6",label:"F6",action:"turbo",w:1},f7:{key:"F7",label:"F7",action:"turbo",w:1},f8:{key:"F8",label:"F8",action:"turbo",w:1},f9:{key:"F9",label:"F9",action:"turbo",w:1},f10:{key:"F10",label:"F10",action:"turbo",w:1},f11:{key:"F11",label:"F11",action:"turbo",w:1},f12:{key:"F12",label:"F12",action:"turbo",w:1},
 numlock:{key:"KEYPAD_CLEAR",label:"num",action:"turbo",w:1},numdiv:{key:"KEYPAD_DIVIDE",label:"/",action:"turbo",w:1},nummult:{key:"KEYPAD_MULTIPLY",label:"*",action:"turbo",w:1},numminus:{key:"KEYPAD_MINUS",label:"-",action:"turbo",w:1},numadd:{key:"KEYPAD_PLUS",label:"+",action:"turbo",w:1,h:3},num0:{key:"KEYPAD0",label:"0",action:"turbo",w:2},numdot:{key:"KEYPAD_DECIMAL",label:".",action:"turbo",w:1},numenter:{key:"ENTER",label:"enter",action:"turbo",w:1,h:2},num7:{key:"KEYPAD7",label:"7",action:"turbo",w:1},num8:{key:"KEYPAD8",label:"8",action:"turbo",w:1},num9:{key:"KEYPAD9",label:"9",action:"turbo",w:1},num4:{key:"KEYPAD4",label:"4",action:"turbo",w:1},num5:{key:"KEYPAD5",label:"5",action:"turbo",w:1},num6:{key:"KEYPAD6",label:"6",action:"turbo",w:1},num1:{key:"KEYPAD1",label:"1",action:"turbo",w:1},num2:{key:"KEYPAD2",label:"2",action:"turbo",w:1},num3:{key:"KEYPAD3",label:"3",action:"turbo",w:1}
};
var KB_LAYOUTS={
 main:{name:"Main Keyboard 78",groups:["F Row","Keys","Arrows"],keys:[
  {id:"esc",x:1.5,y:-4,w:1.5,h:1,g:0},
  {id:"f1",x:3.25,y:-4,w:1,h:1,g:0},{id:"f2",x:4.25,y:-4,w:1,h:1,g:0},{id:"f3",x:5.25,y:-4,w:1,h:1,g:0},{id:"f4",x:6.25,y:-4,w:1,h:1,g:0},
  {id:"f5",x:7.5,y:-4,w:1,h:1,g:0},{id:"f6",x:8.5,y:-4,w:1,h:1,g:0},{id:"f7",x:9.5,y:-4,w:1,h:1,g:0},{id:"f8",x:10.5,y:-4,w:1,h:1,g:0},
  {id:"f9",x:11.75,y:-4,w:1,h:1,g:0},{id:"f10",x:12.75,y:-4,w:1,h:1,g:0},{id:"f11",x:13.75,y:-4,w:1,h:1,g:0},{id:"f12",x:14.75,y:-4,w:1,h:1,g:0},
  {id:"grave",x:1.5,y:-2.75,w:1,h:1,g:1},{id:"1",x:2.5,y:-2.75,w:1,h:1,g:1},{id:"2",x:3.5,y:-2.75,w:1,h:1,g:1},{id:"3",x:4.5,y:-2.75,w:1,h:1,g:1},{id:"4",x:5.5,y:-2.75,w:1,h:1,g:1},{id:"5",x:6.5,y:-2.75,w:1,h:1,g:1},{id:"6",x:7.5,y:-2.75,w:1,h:1,g:1},{id:"7",x:8.5,y:-2.75,w:1,h:1,g:1},{id:"8",x:9.5,y:-2.75,w:1,h:1,g:1},{id:"9",x:10.5,y:-2.75,w:1,h:1,g:1},{id:"0",x:11.5,y:-2.75,w:1,h:1,g:1},{id:"minus",x:12.5,y:-2.75,w:1,h:1,g:1},{id:"equal",x:13.5,y:-2.75,w:1,h:1,g:1},{id:"backspace",x:14.5,y:-2.75,w:1.25,h:1,g:1},
  {id:"tab",x:1.5,y:-1.75,w:1.25,h:1,g:1},{id:"q",x:2.75,y:-1.75,w:1,h:1,g:1},{id:"w",x:3.75,y:-1.75,w:1,h:1,g:1},{id:"e",x:4.75,y:-1.75,w:1,h:1,g:1},{id:"r",x:5.75,y:-1.75,w:1,h:1,g:1},{id:"t",x:6.75,y:-1.75,w:1,h:1,g:1},{id:"y",x:7.75,y:-1.75,w:1,h:1,g:1},{id:"u",x:8.75,y:-1.75,w:1,h:1,g:1},{id:"i",x:9.75,y:-1.75,w:1,h:1,g:1},{id:"o",x:10.75,y:-1.75,w:1,h:1,g:1},{id:"p",x:11.75,y:-1.75,w:1,h:1,g:1},{id:"lbracket",x:12.75,y:-1.75,w:1,h:1,g:1},{id:"rbracket",x:13.75,y:-1.75,w:1,h:1,g:1},{id:"bslash",x:14.75,y:-1.75,w:1,h:1,g:1},
  {id:"caps",x:1.5,y:-0.75,w:1.75,h:1,g:1},{id:"a",x:3.25,y:-0.75,w:1,h:1,g:1},{id:"s",x:4.25,y:-0.75,w:1,h:1,g:1},{id:"d",x:5.25,y:-0.75,w:1,h:1,g:1},{id:"f",x:6.25,y:-0.75,w:1,h:1,g:1},{id:"g",x:7.25,y:-0.75,w:1,h:1,g:1},{id:"h",x:8.25,y:-0.75,w:1,h:1,g:1},{id:"j",x:9.25,y:-0.75,w:1,h:1,g:1},{id:"k",x:10.25,y:-0.75,w:1,h:1,g:1},{id:"l",x:11.25,y:-0.75,w:1,h:1,g:1},{id:"semicolon",x:12.25,y:-0.75,w:1,h:1,g:1},{id:"quote",x:13.25,y:-0.75,w:1,h:1,g:1},{id:"return",x:14.25,y:-0.75,w:1.5,h:1,g:1},
  {id:"lshift",x:1.5,y:0.25,w:2,h:1,g:1},{id:"z",x:3.5,y:0.25,w:1,h:1,g:1},{id:"x",x:4.5,y:0.25,w:1,h:1,g:1},{id:"c",x:5.5,y:0.25,w:1,h:1,g:1},{id:"v",x:6.5,y:0.25,w:1,h:1,g:1},{id:"b",x:7.5,y:0.25,w:1,h:1,g:1},{id:"n",x:8.5,y:0.25,w:1,h:1,g:1},{id:"m",x:9.5,y:0.25,w:1,h:1,g:1},{id:"comma",x:10.5,y:0.25,w:1,h:1,g:1},{id:"period",x:11.5,y:0.25,w:1,h:1,g:1},{id:"slash",x:12.5,y:0.25,w:1,h:1,g:1},{id:"rshift",x:13.5,y:0.25,w:2.25,h:1,g:1},
  {id:"fn",x:1.5,y:1.25,w:1,h:1,g:1},{id:"ctrl",x:2.5,y:1.25,w:1.25,h:1,g:1},{id:"opt",x:3.75,y:1.25,w:1.25,h:1,g:1},{id:"cmd",x:5,y:1.25,w:1.25,h:1,g:1},{id:"space",x:6.25,y:1.25,w:5,h:1,g:1},{id:"rcmd",x:11.25,y:1.25,w:1.5,h:1,g:1},{id:"ropt",x:12.75,y:1.25,w:1.5,h:1,g:1},{id:"rmacro",x:14.25,y:1.25,w:1.5,h:1,g:1},
  {id:"up",x:13.75,y:2.5,w:1,h:1,g:2},
  {id:"left",x:12.75,y:3.5,w:1,h:1,g:2},{id:"down",x:13.75,y:3.5,w:1,h:1,g:2},{id:"right",x:14.75,y:3.5,w:1,h:1,g:2}
 ]},
 numpad:{name:"Numpad 30",groups:["Nav","Arrow Keys","Numbers"],keys:[
  {id:"prtsc",x:-3.25,y:-2,w:1,h:1,g:0},{id:"scrlk",x:-2.25,y:-2,w:1,h:1,g:0},{id:"pause",x:-1.25,y:-2,w:1,h:1,g:0},
  {id:"insert",x:-3.25,y:-1,w:1,h:1,g:0},{id:"home",x:-2.25,y:-1,w:1,h:1,g:0},{id:"pgup",x:-1.25,y:-1,w:1,h:1,g:0},
  {id:"fwddel",x:-3.25,y:0,w:1,h:1,g:0},{id:"end",x:-2.25,y:0,w:1,h:1,g:0},{id:"pgdn",x:-1.25,y:0,w:1,h:1,g:0},
  {id:"up",x:-2.25,y:1.25,w:1,h:1,g:1},
  {id:"left",x:-3.25,y:2.25,w:1,h:1,g:1},{id:"down",x:-2.25,y:2.25,w:1,h:1,g:1},{id:"right",x:-1.25,y:2.25,w:1,h:1,g:1},
  {id:"numlock",x:0.25,y:-2,w:1,h:1,g:2},{id:"numdiv",x:1.25,y:-2,w:1,h:1,g:2},{id:"nummult",x:2.25,y:-2,w:1,h:1,g:2},{id:"numminus",x:3.25,y:-2,w:1,h:1,g:2},
  {id:"num7",x:0.25,y:-1,w:1,h:1,g:2},{id:"num8",x:1.25,y:-1,w:1,h:1,g:2},{id:"num9",x:2.25,y:-1,w:1,h:1,g:2},{id:"numadd",x:3.25,y:-1,w:1,h:2,g:2},
  {id:"num4",x:0.25,y:0,w:1,h:1,g:2},{id:"num5",x:1.25,y:0,w:1,h:1,g:2},{id:"num6",x:2.25,y:0,w:1,h:1,g:2},
  {id:"num1",x:0.25,y:1,w:1,h:1,g:2},{id:"num2",x:1.25,y:1,w:1,h:1,g:2},{id:"num3",x:2.25,y:1,w:1,h:1,g:2},{id:"numenter",x:3.25,y:1,w:1,h:2,g:2},
  {id:"num0",x:0.25,y:2,w:2,h:1,g:2},{id:"numdot",x:2.25,y:2,w:1,h:1,g:2}
 ]}
};
var _kbMode="create",_kbLayout="main",_kbSel=null;
function kbLayoutIds(l){var out=[];KB_LAYOUTS[l].keys.forEach(function(e){out.push(e.id)});return out}
function _kbEntry(id){var lo=KB_LAYOUTS[_kbLayout];for(var i=0;i<lo.keys.length;i++){if(lo.keys[i].id===id)return lo.keys[i]}return null}
function _kbW(id){var e=_kbEntry(id);return e?e.w:((KB_KEYS[id]&&KB_KEYS[id].w)||1)}
function _kbH(id){var e=_kbEntry(id);return e?e.h:((KB_KEYS[id]&&KB_KEYS[id].h)||1)}
function kbCap(id,u){
  var d=KB_KEYS[id];if(!d)return"";
  var _u=u||84,_f1=Math.round(24*_u/84),_f2=Math.round(17*_u/84);
  var w=_kbW(id)*_u-3;
  var hgt=_kbH(id)*_u-3;
  return '<div data-kbk="'+id+'" onclick="kbPick(\''+id+'\')" class="kbk'+( _kbSel===id?" kbk-sel":"")+'" style="width:'+w+'px;height:'+hgt+'px;background:#2a2a3a;border:1px solid #444;border-radius:8px;cursor:pointer;position:relative;box-sizing:border-box;flex:0 0 auto">'+
   (d.shiftLabel?'<span style="position:absolute;top:4px;left:7px;font-size:'+_f2+'px;color:#a78bfa;line-height:1">'+hesc(d.shiftLabel)+'</span>':"")+
   '<span style="position:absolute;'+(d.h>1?'top:50%;transform:translateY(-50%);':'bottom:6px;')+'left:0;right:0;text-align:center;font-size:'+_f1+'px;color:#e8e0d8;line-height:1">'+hesc(d.label||"")+'</span></div>';
}
var _kbU=84;
var KB_GROUP_COLORS=["rgba(167,139,250,0.08)","rgba(74,222,128,0.08)","rgba(251,146,60,0.08)"];
function _kbFit(){
  var lo=KB_LAYOUTS.main,_minX=0,_maxX=0,_minY=0,_maxY=0;
  lo.keys.forEach(function(e){var w=e.w||1,h=e.h||1;if(e.x<_minX)_minX=e.x;if(e.y<_minY)_minY=e.y;if(e.x+w>_maxX)_maxX=e.x+w;if(e.y+h>_maxY)_maxY=e.y+h});
  var bw=(_maxX-_minX)*84+8,bh=(_maxY-_minY)*84+8;
  var uW=Math.floor((Math.floor(window.innerWidth*0.94)-48-30)/bw*84);
  var uH=Math.floor((Math.floor(window.innerHeight*0.9)-190)/bh*84);
  var u=Math.max(10,Math.min(84,uW,uH));
  return {u:u,mainBw:Math.round(bw*u/84)};
}
function kbPickerTab(){
  var tabs=document.getElementById("kbTabs");var _ls=["main","numpad"];
  tabs.innerHTML=_ls.map(function(l){var lo=KB_LAYOUTS[l];return '<button onclick="kbPickerTabSel(\''+l+'\')" style="padding:5px 12px;border-radius:4px;border:1px solid '+(l===_kbLayout?'var(--accent)':'var(--border)')+';background:'+(l===_kbLayout?'var(--accent)':'transparent')+';color:'+(l===_kbLayout?'#1a1a1a':'var(--dim)')+';cursor:pointer;font-size:12px">'+lo.name+'</button>'}).join("");
  var lo=KB_LAYOUTS[_kbLayout];var keys=lo.keys;var _minX=0,_minY=0,_maxX=0,_maxY=0;
  keys.forEach(function(e){var w=e.w||1,h=e.h||1;if(e.x<_minX)_minX=e.x;if(e.y<_minY)_minY=e.y;if(e.x+w>_maxX)_maxX=e.x+w;if(e.y+h>_maxY)_maxY=e.y+h});
  var _u=_kbU;
  var _bw=Math.round(((_maxX-_minX)*84+8)*_u/84),_bh=Math.round(((_maxY-_minY)*84+8)*_u/84);
  var gs=lo.groups||[],gbands="";
  gs.forEach(function(gn,gi){
    var L=1e9,T=1e9,R=-1e9,B=-1e9;
    keys.forEach(function(e){if((e.g||0)!==gi)return;var w=e.w||1,h=e.h||1;
      var x=(e.x-_minX)*_u-6,xx=(e.x+w-_minX)*_u+6,y=(e.y-_minY)*_u-6,yy=(e.y+h-_minY)*_u+6;
      if(x<L)L=x;if(y<T)T=y;if(xx>R)R=xx;if(yy>B)B=yy});
    if(L===1e9)return;
    gbands+='<div style="position:absolute;top:'+T+'px;left:'+L+'px;width:'+(R-L)+'px;height:'+(B-T)+'px;background:'+KB_GROUP_COLORS[gi%3]+';border:1px dashed rgba(255,255,255,0.18);border-radius:8px;pointer-events:none"></div>';
  });
  var leg=document.getElementById("kbLegend");
  leg.innerHTML=gs.map(function(gn,gi){return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--dim);margin-right:12px"><span style="width:10px;height:10px;border-radius:2px;background:'+KB_GROUP_COLORS[gi%3]+';border:1px solid rgba(255,255,255,0.18)"></span>'+hesc(gn)+'</span>'}).join("");
  document.getElementById("kbBoard").innerHTML='<div style="position:relative;display:block;overflow:hidden;width:'+_bw+'px;height:'+_bh+'px;text-align:left;margin:0 auto">'+gbands+keys.map(function(e){
    return '<div style="position:absolute;top:'+((e.y-_minY)*_u)+'px;left:'+((e.x-_minX)*_u)+'px">'+kbCap(e.id,_u)+'</div>';
  }).join("")+'</div>';
  kbPickerBtns();
}
function kbPickerTabSel(l){_kbLayout=l;_kbSel=null;kbSelInfo();kbPickerTab()}
function kbSelInfo(){
  var _si=document.getElementById("kbSelInfo");if(!_si)return;
  var d=_kbSel?KB_KEYS[_kbSel]:null;
  _si.textContent=d?("Selected: "+d.label+(d.shiftLabel?(" ⇧"+d.shiftLabel):"")+" → sends "+d.key):"Click a key to select, click again to deselect";
}
function kbPick(id){
  _kbSel=(_kbSel===id)?null:id;
  var bs=document.querySelectorAll("#kbBoard .kbk");
  for(var i=0;i<bs.length;i++){bs[i].classList.toggle("kbk-sel",bs[i].getAttribute("data-kbk")===_kbSel)}
  kbSelInfo();kbPickerBtns();
}
function kbPickerBtns(){
  var b1=document.getElementById("kbBtnAll"),b2=document.getElementById("kbBtnOne");
  if(b1)b1.style.display=_kbMode==="create"?"":"none";
  if(b2){b2.textContent=_kbMode==="create"?"Drag Selected Key Only":"Replace with selected key";b2.disabled=!_kbSel;b2.style.opacity=_kbSel?"1":"0.4";b2.style.cursor=_kbSel?"pointer":"default"}
}
function openKbPicker(mode){
  _kbMode=mode||"create";_kbSel=null;_kbLayout="main";
  var f=_kbFit();_kbU=f.u;
  var p=document.getElementById("kbPicker").firstElementChild;
  if(p)p.style.width=Math.min(Math.floor(window.innerWidth*0.94),f.mainBw+48)+"px";
  if(_kbMode==="change"){var k=cp_()?.keys.find(function(x){return x.id===selKey});if(k&&k.key){var _k=k.key;["main","numpad"].forEach(function(l){if(_kbSel===null){var ids=kbLayoutIds(l);for(var i2=0;i2<ids.length;i2++){if(KB_KEYS[ids[i2]].key===_k){_kbLayout=l;_kbSel=ids[i2];break}}}})}}
  kbSelInfo();kbPickerTab();_showModal("kbPicker");
}
function closeKbPicker(){_hideModal("kbPicker")}
function _kbNewKey(d,id,ac,ar,w,h){
  var nk={id:id,action:d.action||"turbo",kb:true,key:d.key,label:d.label,value:d.key,color:"#3a3a4a",sound:(profile&&profile.defaultSound)||"click",col:ac,row:ar,w:w||d.w||1,h:h||d.h||1};
  if(d.shiftLabel)nk.shiftLabel=d.shiftLabel;
  return nk;
}
function confirmKbLayout(){
  var page=cp_();if(!page)return;
  var ac=window._pendingCol||0,ar=window._pendingRow||0,_ts=Date.now(),_i=0,added=[];
  var gBefore=JSON.parse(JSON.stringify(profile.groups||[]));
  if(!profile.groups)profile.groups=[];
  var lo=KB_LAYOUTS[_kbLayout];
  var gnames=lo.groups||[],gids={};
  gnames.forEach(function(gn,i){var gid="g_"+_ts+"_"+i;profile.groups.push({id:gid,name:gn});gids[i]=gid});
  lo.keys.forEach(function(e){
    var d=KB_KEYS[e.id];if(!d)return;
    var nk=_kbNewKey(d,"k_"+_ts+"_"+(++_i),ac+e.x,ar+e.y,_kbW(e.id),_kbH(e.id));
    var gi=(e.g===undefined)?0:e.g;
    if(gids[gi]!==undefined)nk.groups=[gids[gi]];
    added.push(nk);
  });
  added.forEach(function(k){page.keys.push(k)});
  _pushUndo([],added,gBefore,profile.groups);
  if(added.length){selKey=added[0].id;selKeys.clear();selKeys.add(selKey)}
  _setDirty();closeKbPicker();rr();rpr();rgrp();
}
function confirmKbKey(){
  var page=cp_();if(!page||!_kbSel)return;
  var d=KB_KEYS[_kbSel];if(!d)return;
  if(_kbMode==="change"){
    var k=page.keys.find(function(x){return x.id===selKey});if(!k)return;
    var before=_snapshot(k);
    k.kb=true;k.key=d.key;k.label=d.label;k.value=d.key;k.w=_kbW(_kbSel);k.h=_kbH(_kbSel);
    if(d.shiftLabel){k.shiftLabel=d.shiftLabel}else{delete k.shiftLabel}
    k.action=d.action||"turbo";
    _setDirty();if(JSON.stringify(before)!==JSON.stringify(_snapshot(k)))_pushUndo([before]);
    closeKbPicker();rr();rpr();return;
  }
  var nk=_kbNewKey(d,"k_"+Date.now()+"_kb",window._pendingCol||0,window._pendingRow||0,_kbW(_kbSel),_kbH(_kbSel));
  page.keys.push(nk);_pushUndo([],[nk]);selKey=nk.id;selKeys.clear();selKeys.add(nk.id);
  _setDirty();closeKbPicker();rr();rpr();
}

var WIDGET_TYPES={key:{label:"Combo Key",defaults:{w:1.25,h:1.25,color:"#3a3a4a",action:"turbo",label:"Key"}},touchpad:{label:"Touch Pad",defaults:{w:4,h:3,color:"#2a3a5a",action:"touchpad",label:"Touch Pad",scrollEnabled:true,rightClickEnabled:true}},volume:{label:"Volume Slider",defaults:{w:2.5,h:1.25,color:"#002455",action:"volume",iconColor:"#a1ffd1",layout:"horizontal",label:"Volume"}},micmute:{label:"Mic Mute",defaults:{w:2.5,h:1.25,color:"#1a2a2a",action:"mic-mute",showLevel:true,micLevelColor:"#c6fea5",micColor:"#b9ff71",label:"Mic"}},audioout:{label:"Audio Out",defaults:{w:3.25,h:1.5,color:"#002455",action:"audio-out",tapAction:"cycle",holdAction:"menu",label:"Audio Out"}},audioin:{label:"Audio In",defaults:{w:3.25,h:1.25,color:"#1a2a2a",action:"audio-in",tapAction:"cycle",holdAction:"menu",label:"Audio In"}},activeapp:{label:"Window Switcher",defaults:{w:9.25,h:3,color:"#1a1a1a",action:"active-app",label:"Apps",closeSound:""}},wingesture:{label:"Window Control · Swipe",defaults:{w:3.25,h:3,color:"#00334a",iconColor:"#cfd8dc",bgOpacity:0.53,action:"win-gesture",label:"Gesture"}},fullscreen:{label:"Fullscreen Toggle",defaults:{w:1.5,h:1.25,color:"#1a3a2a",action:"fullscreen",label:"Fullscreen",showIcon:true,showLabel:true,iconSize:20}},dock:{label:"Dock Panel",defaults:{w:9.25,h:1.5,color:"#1a1a1a",action:"dock",bgOpacity:0.11,bgColor:"#ffffff",label:"Dock"}},switchprofile:{label:"Switch Profile",defaults:{w:1.5,h:1.25,color:"#2a1a3a",action:"switch-profile",switchMode:"hold",label:"Profile",iconColor:"#a78bfa",showIcon:true,showLabel:true,iconSize:20}},imeswitch:{label:"Input Method",defaults:{w:2,h:1.25,color:"#1a2a3a",action:"ime-switch",iconColor:"#4ade80",showIcon:true,showLabel:true,iconSize:20,tapAction:"cycle",tapTarget:"",holdAction:"select",holdTarget:"",label:"Input Method"}},balance:{label:"Deepseek Balance",defaults:{w:3.5,h:1.25,color:"#003a5a",action:"balance",showFlags:{total:true,granted:true,topped:true},label:"Balance"}},textmacro:{label:"Text Macro",defaults:{w:4,h:2.5,color:"#1a2a1a",action:"text-macro",label:"Text Macro",macroText:""}},keyboard:{label:"Keyboard Key",defaults:{w:1,h:1,color:"#3a3a4a",action:"turbo",label:"Key"}}};;function addKeyOfType(type){
  var page=cp_();if(!page)return;
  if(type==="keyboard"){closeKeyTypeModal();openKbPicker("create");return}
  var wt=WIDGET_TYPES[type]||WIDGET_TYPES.key;
  var d=wt.defaults;
  var nk={id:"k_"+Date.now(),label:d.label||"?",action:d.action,value:"A",
    color:d.color,col:window._pendingCol||0,row:window._pendingRow||0,w:d.w,h:d.h,sound:(profile&&profile.defaultSound)||"click",
    macroText:d.macroText,
    tapAction:d.tapAction,holdAction:d.holdAction,tapTarget:d.tapTarget,holdTarget:d.holdTarget,
    layout:d.layout,iconColor:d.iconColor,
    micLevelColor:d.micLevelColor,micColor:d.micColor,showLevel:d.showLevel,
    bgOpacity:d.bgOpacity,bgColor:d.bgColor,switchMode:d.switchMode,showFlags:d.showFlags,showIcon:d.showIcon,showLabel:d.showLabel,iconSize:d.iconSize,iconColor:d.iconColor};
  page.keys.push(nk);
  _pushUndo([],[nk]);selKey=nk.id;selKeys.clear();selKeys.add(selKey);
  _setDirty();closeKeyTypeModal();rr();rpr();
}
function closeKeyTypeModal(){_hideModal("keyTypeModal");document.getElementById("gh").style.display="none"}
function dkey(){const p=cp_();if(!p)return;const ids=Array.from(new Set([...selKeys,...(selKey?[selKey]:[])]));if(!ids.length||!confirm("Delete?"))return;const before=p.keys.filter(function(k){return ids.indexOf(k.id)>=0}).map(function(k){return _snapshot(k)});p.keys=p.keys.filter(function(k){return ids.indexOf(k.id)<0});ids.forEach(function(id){selKeys.delete(id)});selKey=null;selGroup=null;if(before.length)_pushUndo(before);_setDirty();renderAll()}

// ── Sound ──
const SND={none:null,click:[800,0.06,"square",0.3],soft:[400,0.08,"sine",0.2],mechanical:[1200,0.04,"square",0.4],deep:[200,0.1,"triangle",0.5],red:[300,0.04,"sine",0.15],topre:[500,0.07,"sine",0.18,900,0.008],glass:[2400,0.05,"sine",0.12],bubble:[600,0.06,"sine",0.22,"sweep"],blip:[440,0.05,"square",0.2,"sweep"],spark:[3000,0.02,"sawtooth",0.1,0.4]};
let actx=null;
function testSnd(nm){if(!nm||nm==="none")return;const s=SND[nm];if(!s)return;try{if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume();const o=actx.createOscillator(),g=actx.createGain();o.type=s[2];if(s[4]==="sweep"){o.frequency.setValueAtTime(s[0]*1.5,actx.currentTime);o.frequency.exponentialRampToValueAtTime(s[0]*0.5,actx.currentTime+s[1])}else{o.frequency.setValueAtTime(s[0],actx.currentTime)}g.gain.setValueAtTime(s[3],actx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+s[1]);o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+s[1]);if(s.length===6){const o2=actx.createOscillator(),g2=actx.createGain();o2.type="square";o2.frequency.setValueAtTime(s[4],actx.currentTime+0.003);g2.gain.setValueAtTime(s[3]*0.5,actx.currentTime+0.003);g2.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+s[5]);o2.connect(g2);g2.connect(actx.destination);o2.start(actx.currentTime+0.003);o2.stop(actx.currentTime+s[5])}if(s.length===5&&typeof s[4]==="number"){const bs=actx.sampleRate*s[1],buf=actx.createBuffer(1,bs,actx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<bs;i++)d[i]=(Math.random()*2-1)*s[4];const n=actx.createBufferSource(),gn=actx.createGain();n.buffer=buf;gn.gain.setValueAtTime(s[3]*0.3,actx.currentTime);gn.gain.exponentialRampToValueAtTime(0.001,actx.currentTime+s[1]*0.5);n.connect(gn);gn.connect(actx.destination);n.start(actx.currentTime)}}catch(e){}}
function _addSndPreviews(){var _ss=document.querySelectorAll("#pc select");for(var _i=0;_i<_ss.length;_i++){var _s=_ss[_i];var _oc=_s.getAttribute("onchange")||"";if(_oc.toLowerCase().indexOf("sound")<0)continue;var _b=document.createElement("button");_b.className="pv-btn";_b.innerHTML="&#x25B6;";_b.title="Preview";_b.style.cssText="padding:4px 8px;font-size:12px;background:var(--card);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;margin-left:4px";_b.onmouseover=function(){this.style.borderColor="var(--accent)"};_b.onmouseout=function(){this.style.borderColor="var(--border)"};_b.onclick=function(s){return function(e){e.preventDefault();e.stopPropagation();var v=s.value;if(!v||v===""){v=(profile&&profile.defaultSound)||"click"}if(v&&v!=="")testSnd(v)}}(_s);_s.parentNode.insertBefore(_b,_s.nextSibling)};_addStyleBtns()}

function _addStyleBtns(){var pc=document.getElementById("pc");if(!pc)return;var del=pc.querySelector(".btn-del");if(!del||pc.querySelector(".style-actions"))return;var d=document.createElement("div");d.className="style-actions";d.innerHTML='<button onclick="copyStyle()">&#x29C9; Copy Style</button><button class="ps-btn" onclick="pasteStyle()">&#x2398; Paste Style</button>';del.closest(".br").insertAdjacentElement("beforebegin",d);_refreshStyleBtns()}
function _refreshStyleBtns(){var b=document.querySelector(".style-actions .ps-btn");if(b){b.disabled=!copiedStyle}}
function t(msg){const el=document.getElementById("toast");el.textContent=msg;el.className="toast";el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2000)}

// ── Sound edit mode: left panel swaps to sound submenu; drag sounds onto keys / selection ──
var _SE_SOUNDS=[["none","None"],["click","Click"],["soft","Soft"],["mechanical","Mechanical"],["deep","Deep"],["red","Red Switch"],["topre","Topre EC"],["glass","Glass Tap"],["bubble","Bubble Pop"],["blip","8-bit Blip"],["spark","Electric Spark"]];
var _SE_COLORS={"none":"#565656","click":"#60a5fa","soft":"#4ade80","mechanical":"#f59e0b","deep":"#a78bfa","red":"#f87171","topre":"#2dd4bf","glass":"#22d3ee","bubble":"#f472b6","blip":"#facc15","spark":"#a3e635"};
var _seOpen=false;
var _seDragSound=null,_seDropId=null;
function _seSoundLabel(v){for(var i=0;i<_SE_SOUNDS.length;i++){if(_SE_SOUNDS[i][0]===v)return _SE_SOUNDS[i][1]}return v||"Inherit"}
function _sePreview(v){testSnd(v)}
function _seBuildList(){
  var el=document.getElementById("seList");if(!el)return;
  el.innerHTML="";
  _SE_SOUNDS.forEach(function(s){var v=s[0],c=_SE_COLORS[v]||"#8b8b8b";
    var row=document.createElement("div");
    row.className="se-item";row.draggable=true;
    row.innerHTML='<span style="width:10px;height:10px;border-radius:50%;background:'+c+';flex:none"></span><span style="flex:1;font-size:12px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+hesc(s[1])+'</span><button onclick="event.stopPropagation();_sePreview(\''+v+'\')" title="Preview" style="width:24px;height:20px;font-size:9px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;cursor:pointer;flex:none">&#x25B6;</button>';
    row.title="Drag onto a key to apply";
    row.addEventListener("dragstart",function(e){if(e.target.tagName==="BUTTON"){e.preventDefault();return}_seDragSound=v;e.dataTransfer.setData("text/plain","__sound__:"+v);e.dataTransfer.effectAllowed="copy"});
    el.appendChild(row);
  });
}
function _seRefresh(){
  if(!_seOpen)return;
  var hint=document.getElementById("seHint");if(!hint)return;
  var n=selKeys.size||(selKey?1:0);
  if(!n)hint.textContent="Select keys on the canvas, then drag a sound onto them";
  else if(n>1)hint.textContent=n+" keys selected — drag a sound onto the canvas to apply to all";
  else hint.textContent="1 key selected — drag a sound onto it";
}
function _seApply(v,ids){
  var page=cp_();if(!page||!_seOpen)return;
  if(!ids.size){t("Select keys first");return}
  var befores=[],n=0;
  page.keys.forEach(function(k){
    if(!ids.has(k.id))return;
    var b=_snapshot(k);
    if(v)k.sound=v;else delete k.sound;
    // ""(per-key dropdown Inherit)与字段缺失是同一语义,统一按 null 比较,避免无谓 dirty
    if((b.sound||null)!==(k.sound||null)){befores.push(b);n++}
  });
  if(!n){t("No changes — keys already use "+_seSoundLabel(v));return}
  if(befores.length)_pushUndo(befores);
  _setDirty();rr();_seRefresh();
  t("Set "+_seSoundLabel(v)+" on "+n+" key"+(n>1?"s":""));
  _sePreview(v);
}
function _seHitKey(dx,dy){
  var page=cp_();if(!page)return null;
  var dw=profile.deviceWidth||1210,dh=profile.deviceHeight||834,cs=profile.cellSize||60,gp=profile.gap||0,cpx=cs+gp;
  var col=(dx-dw/2)/cpx-panX,row=(dy-dh/2)/cpx-panY;
  for(var i=page.keys.length-1;i>=0;i--){var k=page.keys[i],w=k.w||1,h=k.h||1;
    if(col>=(k.col||0)&&col<(k.col||0)+w&&row>=(k.row||0)&&row<(k.row||0)+h)return k}
  return null;
}
function _seDropSound(v,dx,dy){
  if(!_seOpen)return;
  _seClearDropTarget();
  if(!profile||!cp_())return;
  if(selKeys.size>1){_seApply(v,selKeys);return}
  var hit=_seHitKey(dx,dy);
  if(hit){_seApply(v,new Set([hit.id]));return}
  t("Drop onto a key to apply");
}
function _seSetDropTarget(id){
  if(id===_seDropId)return;
  _seClearDropTarget();
  if(id===null)return;
  _seDropId=id;
  var ca=document.getElementById("carea");if(!ca)return;
  if(id==="__sel__"){selKeys.forEach(function(kid){var el=ca.querySelector('.ck[data-kid="'+kid+'"]');if(el)el.classList.add("sd-drop")})}
  else{var el=ca.querySelector('.ck[data-kid="'+id+'"]');if(el)el.classList.add("sd-drop")}
}
function _seClearDropTarget(){
  var ca=document.getElementById("carea");
  if(ca){var els=ca.querySelectorAll(".ck.sd-drop");for(var i=0;i<els.length;i++)els[i].classList.remove("sd-drop")}
  _seDropId=null;
}
function openSoundEdit(){
  if(_seOpen){closeSoundEdit();return}
  if(!profile){t("Create a profile first");return}
  var page=cp_();if(!page||!page.keys.length){t("This page has no keys");return}
  _seOpen=true;
  var ca=document.getElementById("carea");if(ca)ca.classList.add("sound-edit");
  var lp=document.getElementById("lp-panel");if(lp)lp.classList.add("sound-edit");
  _seBuildList();
  rr();_seRefresh();
}
function closeSoundEdit(){
  if(!_seOpen)return;
  _seOpen=false;
  _seDragSound=null;_seClearDropTarget();
  var ca=document.getElementById("carea");if(ca)ca.classList.remove("sound-edit");
  var lp=document.getElementById("lp-panel");if(lp)lp.classList.remove("sound-edit");
  rr();
}
function _showModal(id){var el=document.getElementById(id);if(!el)return;if(el._acT){clearTimeout(el._acT);el._acT=null}el.classList.remove("m-out");el.style.display="flex"}
function _hideModal(id,fn){var el=document.getElementById(id);if(!el)return;if(el._acT)return;el.classList.add("m-out");el._acT=setTimeout(function(){el._acT=null;el.classList.remove("m-out");el.style.display="none";if(fn)fn()},150)}

window.addEventListener("resize",()=>rr());
window.addEventListener("beforeunload",function(e){if(dirty){e.preventDefault();e.returnValue=""}});
fetch("/api/system/ime/status").then(function(r){return r.json()}).then(function(j){window._imeList=j.list||[];if(selKey){var _k=cp_()?.keys.find(function(x){return x.id===selKey});if(_k&&_k.action==="ime-switch"){rpr()}}}).catch(function(){window._imeList=[]});
setTimeout(function(){buildRatioPresets()},200);cws();lpl().then(function(){var saved=localStorage.getItem("stp_active");if(saved&&profiles.some(function(p){return p.filename===saved})){_doLp(saved)}else if(profiles.length>0){_doLp(profiles[0].filename)}else{activeProfile="";profile=null;profileLoaded=true;_markClean();renderAll()}})
