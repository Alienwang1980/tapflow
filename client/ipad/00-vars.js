"use strict";
let profile=null,activePage="",activeProfile="Default.json";
let _profNames={};function _loadProfNames(cb){fetch("/api/profiles").then(function(r){return r.json()}).then(function(d){var m={};(d.profiles||[]).forEach(function(p){m[p.filename]=p.profileName});_profNames=m;if(cb)cb()}).catch(function(){})}
let ws=null,timer=null,delay=1000,profileLoaded=false;
var _gFont="";var _gBalCur="CNY";function _gf(){return _gFont?"'"+_gFont+"'":"-apple-system,sans-serif"}
function _escHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
