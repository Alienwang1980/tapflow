// ── Tapflow promo-site i18n ──
// HTML carries the Chinese text as fallback + source of truth for zh.
// The EN dictionary below covers only keys that differ; missing keys keep the HTML text.
// All content from README_EN.md — no new translations were invented.

(function () {
  "use strict";

  var EN = {
    "meta.title": "Tapflow / 点流 — Your Personal Control Layer",
    "meta.desc": "Turn your iPad into a touch control panel for your Mac: 14 widgets, a WYSIWYG editor, zero install, millisecond latency. Open source, MIT.",

    "nav.features": "Features",
    "nav.scenarios": "Scenarios",
    "nav.setup": "Setup",
    "nav.faq": "FAQ",

    "hero.sub": "It isn't a keyboard replacement — it works alongside keyboard and mouse: shortcut actions become dedicated buttons, reducing what you have to memorize.",
    "hero.brand": "Tapflow",
    "hero.tagline": "A New Way to Input in the AI Era",
    "hero.dl": "Download Tapflow",
    "hero.gh": "View on GitHub",
    "hero.f1": "macOS 26+ · arm64",
    "hero.f2": "iPad · zero install",
    "hero.f3": "millisecond latency",

    "p.kicker": "The Problem",
    "p.title": "Your Brain Is the Most Precise Intelligence on Earth — Not for Memorizing Shortcuts",
    "p.lead": "The keyboard you're using was designed before the light bulb. 150 years later, you're still controlling your computer with the same interaction logic.",
    "p1.title": "Memory overload",
    "p1.body": "Shortcut count easily outgrows memory. What does ⌘⌥⇧K do? Recall the function, recall the position, hunt with your fingers — once you have enough shortcuts, this process interrupts your flow.",
    "p2.title": "A waste of resources",
    "p2.body": "Your phone recognizes your face, your computer recognizes your fingerprint — yet you still operate your computer by memorizing shortcuts. Your brain, the most powerful computing capability on Earth, spent on memorizing shortcuts is a waste of resources.",
    "p3.title": "Limits of physical hardware",
    "p3.body": "Physical macro pads: keys are remappable, but their shape and size never change — and after enough customization, remembering each key's purpose remains a burden. The Stream Deck works well, priced from three figures.",

    "r.kicker": "However, things have changed.",
    "r.body": "In the AI era, vibe coding actually lowers the demand on keyboards while raising new demands on input methods.",
    "r.title": "Tapflow was born for simpler, faster input.",
    "r.body2": "A fully customizable input surface for controlling your computer. No app to install on the tablet — a small server runs on your Mac, the tablet connects through the browser, that's it.",
    "r.flow1": "Touch",
    "r.note": "The latency is imperceptible.",

    "b.kicker": "Features",
    "b.title": "14 Widgets. Take What You Need.",
    "b2.title": "Editor: Drag. Drop. Done.",
    "b2.body": "Drag-and-drop canvas, full customization (color, size, font, sound, icon, label), multi-select & group, infinite undo, device presets, scroll to zoom. WYSIWYG.",
    "b3.title": "Millisecond latency",
    "b3.body": "Every touch → WebSocket → CGEvent injected into macOS. Imperceptible.",
    "b4.title": "Auto-switching profiles",
    "b4.body": "Switch apps, and the panel switches layouts automatically. One-tap profile switching.",
    "b5.title": "Zero install on tablet",
    "b5.body": "Open a URL in any browser — any device, including your phone.",
    "b6.title": "Native macOS integration",
    "b6.body": "Window management, audio devices, dock, mic levels — system-level capabilities, called directly.",
    "b7.title": "Open source · MIT",
    "b7.body": "v1, early access, free — the code is fully open.",
    "b8.title": "Up in 5 minutes",
    "b8.body": "Two preset profiles work out of the box. Drag, drop, done.",

    "s.kicker": "Scenarios",
    "s.title": "Scenarios, Not Feature Lists",
    "s1.title": "🎤 One-Tap Voice Input for Vibe Coding",
    "s1.a": "You're vibe coding. AI is writing the code, and you want to speak your next prompt. With a keyboard: find the voice input shortcut (depends on your speech recognition software — which one was it?) → press it → speak → press again to stop.",
    "s1.b": "With Tapflow: on your iPad, there's a button labeled \"🎤 Talk\". Tap. Speak. Tap again.",
    "s1.q": "It's not about saving two keystrokes. It's about never breaking your train of thought to remember how to start talking.",
    "s2.title": "🕹️ Window Tiling as a Joystick",
    "s2.a": "macOS window snapping is excellent. But how do you trigger it? Memorize a shortcut, or click with the mouse every single time.",
    "s2.b": "Tapflow's Window Swipe widget turns window management into a joystick: swipe up → fullscreen. Swipe left → snap left. Swipe bottom-right → bottom-right corner. Tap to maximize. Long-press for fullscreen.",
    "s2.q": "It feels like a game controller — arranging windows shouldn't require a keyboard at all.",
    "s3.title": "🖼️ Window Thumbnails — See Before You Switch",
    "s3.a": "⌘Tab is blind guessing. You see app icons, not window contents. Three VS Code windows open? Good luck finding the right one.",
    "s3.b": "Window Switcher shows live thumbnails of every window, grouped by app, horizontally scrollable. You see exactly what's in each window before you switch. Tap the one you want.",
    "s3.q": "See it. Then switch.",
    "s4.title": "📱 Dock on Your Tablet, Screen on Your Work",
    "s4.a": "macOS Dock takes up the bottom of your screen. Hide it and it's annoying to summon.",
    "s4.b": "Put the Dock Panel on your tablet instead. Launch apps, quit apps — from your iPad. Hide the Dock on your Mac. Every pixel goes to your work.",
    "s4.q": "Give your screen back to work.",
    "s5.title": "🔊 Switch Audio Devices in One Second",
    "s5.a": "AirPods for a meeting. Studio monitors for music. Gaming headset. Switching means: System Settings → Sound → Output → find device → click. Every. Single. Time. Unintuitive and tedious.",
    "s5.b": "Tapflow's Audio Out widget: one button shows all devices. Tap to pick. Long-press to cycle.",
    "s5.q": "One second.",
    "s6.title": "⌨️ iPad as Your Entire Keyboard",
    "s6.a": "A tablet screen is big enough. Fill it with keys, a touchpad, gesture pads, window joysticks — your iPad becomes an input surface designed entirely around your habits.",
    "s6.b": "Every key follows your habits: size, color, icon, sound — all up to you.",
    "s6.q": "It's not about replacing the keyboard — it's about being able to transform whenever you need it.",
    "s7.title": "🤖 The Widgets Vibe Coding Needs",
    "s7.a": "Take the highest-frequency actions in your vibe coding workflow and turn each into its own shortcut button. Put them on any device you like.",
    "s7.b": "These buttons aren't just inputs — they're outputs too. Watch your DeepSeek balance right on the button. An input panel, and an information panel. Support for more AI tools will roll out over time.",
    "s7.q": "A button that talks back.",

    "st.kicker": "Setup",
    "st.title": "Five Minutes to Your Own Panel",
    "st1.title": "Download the DMG, drag to /Applications",
    "st1.body": "Get the latest build from GitHub Releases.",
    "st2.title": "First open: pass Gatekeeper",
    "st2.body": "You'll see a \"cannot be verified\" prompt (v1 ships signed with a Developer ID, not notarized) → System Settings → Privacy & Security → \"Open Anyway\". Once only.",
    "st3.title": "Grant the permissions",
    "st3.body": "Accessibility ✅ keyboard event injection · Screen Recording ✅ window thumbnails · Microphone ❌ optional, audio levels.",
    "st4.title": "(Optional) Enable auto-start",
    "st4.body": "A launchd daemon starts it on boot and relaunches it on crash.",
    "st5.title": "Same WiFi, open a URL on your tablet",
    "st5.body": "Open http://<Mac-IP>:8082 in any browser. No app to install.",
    "st6.title": "Drag a few buttons, save",
    "st6.body": "Open http://localhost:8082/editor on your Mac. WYSIWYG.",
    "st.gate.title": "About the \"cannot be verified\" warning",
    "st.gate.body": "v1 is signed with a Developer ID but not notarized, so Gatekeeper soft-blocks it once. This is the standard process for unnotarized apps — not a security risk. Set it once and it opens normally forever. Every step is in the FAQ.",

    "dl.title": "Try it now",
    "dl.sub": "Tapflow only communicates between devices on your local network — nothing is collected or uploaded to the internet.",
    "dl.gh.d": "Official direct link · newest builds land here first",
    "dl.gh": "Download from GitHub",
    "dl.src": "View source",
    "dl.baidu.t": "Baidu Netdisk",
    "dl.baidu.d": "GitHub slow in your region? Use this China mirror.",
    "dl.baidu.go": "Download from Baidu Netdisk",
    "dl.baidu.code": "Access code: qw3m",
    "dl.note1": "The DMG ships with 2 preset profiles — import them in the editor to try it out.",
    "dl.req": "System requirements: macOS 26+ · Apple Silicon (M1 or newer)",

    "f.kicker": "FAQ",
    "f.title": "FAQ",
    "f.q1": "\"Cannot be verified\" on first open?",
    "f.a1": "The current release is signed with a Developer ID (not notarized), so Gatekeeper soft-blocks it once. System Settings → Privacy & Security → \"Open Anyway\" — once only, then it opens normally.",
    "f.q2": "Tablet can't connect?",
    "f.a2": "Same WiFi. Check the Mac's IP in the menu bar dropdown. Firewall must allow port 8082.",
    "f.q3": "Keys not working?",
    "f.a3": "System Settings → Privacy & Security → Accessibility → make sure Tapflow is checked.",
    "f.q4": "No window thumbnails?",
    "f.a4": "System Settings → Privacy & Security → Screen Recording → make sure Tapflow is checked.",
    "f.q5": "Does the tablet need an app?",
    "f.a5": "No. Open a URL in any browser. Supports PWA \"Add to Home Screen.\"",
    "f.q6": "Windows / Linux support?",
    "f.a6": "macOS only for now (depends on CGEvent + PyObjC).",

    "foot.tagline": "A New Way to Input in the AI Era — minimal, fast, and personal.",
    "foot.name.cn": "",
    "foot.issue": "Feedback / Issues"
  };

  var ZHTitle = "Tapflow / 点流 —— 你的个性化控制层";
  var ZHDesc = "把 iPad 变成 Mac 的触控输入面板:14 种组件、所见即所得编辑器、零安装、毫秒级延迟。开源免费,MIT。";
  var ENTitle = EN["meta.title"];
  var ENDesc = EN["meta.desc"];

  function current() {
    var l = document.documentElement.getAttribute("data-lang");
    return l === "en" ? "en" : "zh";
  }

  function apply(lang) {
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute("data-i18n");
      if (lang === "en") {
        if (el._zhText === undefined) el._zhText = el.textContent;
        if (EN[key] !== undefined) el.textContent = EN[key];
      } else {
        if (el._zhText !== undefined) el.textContent = el._zhText;
      }
    }
    var shown = document.querySelectorAll("[data-lang-show]");
    for (var j = 0; j < shown.length; j++) {
      shown[j].hidden = shown[j].getAttribute("data-lang-show") !== lang;
    }
    document.title = lang === "en" ? ENTitle : ZHTitle;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = lang === "en" ? ENDesc : ZHDesc;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.documentElement.classList.remove("pre-lang");
  }

  function setLang(lang, persist) {
    if (lang !== "zh" && lang !== "en") return;
    document.documentElement.setAttribute("data-lang", lang);
    if (persist) {
      try { localStorage.setItem("tapflow-lang", lang); } catch (e) {}
    }
    apply(lang);
    var btns = document.querySelectorAll("[data-lang-btn]");
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-lang-btn") === lang;
      btns[i].classList.toggle("active", on);
      btns[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  // Bootstrap: lang already resolved by the anti-FOUC script in <head>
  var boot = current();
  var param = null;
  try { param = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  if (param === "zh" || param === "en") setLang(param, true);
  else setLang(boot, false);

  window.TAPFLOW_LANG = { current: current, setLang: setLang, apply: apply };
})();
