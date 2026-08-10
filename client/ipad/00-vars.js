"use strict";
let profile=null,activePage="",activeProfile="Default.json";
let _profNames={};function _loadProfNames(cb){fetch("/api/profiles").then(function(r){return r.json()}).then(function(d){var m={};(d.profiles||[]).forEach(function(p){m[p.filename]=p.profileName});_profNames=m;if(cb)cb()}).catch(function(){})}
let ws=null,timer=null,delay=1000,profileLoaded=false;
