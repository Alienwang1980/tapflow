// ── Tapflow promo-site interactions ──
(function () {
  "use strict";

  // 1. Language switcher buttons
  var langBtns = document.querySelectorAll("[data-lang-btn]");
  for (var i = 0; i < langBtns.length; i++) {
    langBtns[i].addEventListener("click", function () {
      window.TAPFLOW_LANG.setLang(this.getAttribute("data-lang-btn"), true);
    });
  }

  // 2. Inject SVG icons from the shared icon library
  if (window.TAPFLOW_ICONS && window.TAPFLOW_ICONS.svg) {
    var icons = document.querySelectorAll("[data-icon]");
    for (var j = 0; j < icons.length; j++) {
      var key = icons[j].getAttribute("data-icon");
      if (window.TAPFLOW_ICONS.svg[key]) {
        icons[j].innerHTML = window.TAPFLOW_ICONS.svg[key];
      }
    }
  }

  // 2b. 3D mockup (mckp.live):
  //     - mckp 自带「Loading scene」进度条(closed shadow DOM 内),默认偏在角落 →
  //       注入样式把它居中(mountPoint 是公开属性,可挂 <style>)
  //     - 静态占位图 poster 永不隐藏:mckp 的 WebGL canvas 是 alpha:true,
  //       首帧渲染前 canvas 透明 → poster 透出;首帧画上后场景背景不透明,
  //       自然盖住 poster(2026-09-13 实测:poster 显隐对画面零影响)。
  //       旧方案以「canvas 创建/进度条卸载」为信号隐藏 poster,与真实首帧
  //       之间有长空窗 → loading 完黑屏半天 + 切换闪烁;且渲染失败时
  //       poster 垫底还能兜底显示静态图。
  (function () {
    var CENTER_CSS = [
      // 进度条本体 + 其父 overlay 全屏 flex 居中(:has 兜底类名 hash 变化)
      "[role='progressbar'], ._overlay_5nsm1_3, *:has(> [role='progressbar']) {",
      "  position: absolute !important; inset: 0 !important; margin: 0 !important;",
      "  display: flex !important; align-items: center !important; justify-content: center !important;",
      "}",
      "[role='progressbar'] { position: absolute !important; inset: auto !important; width: min(50%, 320px) !important; }"
    ].join("\n");

    function wire(boxSel) {
      var box = document.querySelector(boxSel);
      var player = box && box.querySelector("mockup-player");
      if (!box || !player) return;
      var ticks = 0;
      var t = setInterval(function () {
        var mp = player.mountPoint;
        if (!mp) return;
        if (!mp.__tfStyle) { // 注入一次居中样式
          mp.__tfStyle = true;
          var st = document.createElement("style");
          st.textContent = CENTER_CSS;
          mp.appendChild(st);
        }
        // canvas 建好即停止轮询(样式已注入,余下交给 canvas 透明垫底机制)
        if (mp.querySelector("canvas") || ++ticks > 120) clearInterval(t);
      }, 1000);
    }
    wire(".hero-player");
    wire(".duo-player");
  })();

  // 3. Scroll-reveal (once per element)
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // 4. Sticky nav state
  var nav = document.querySelector(".nav");
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        nav.classList.toggle("scrolled", window.scrollY > 20);
        ticking = false;
      });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // 5. Demo videos: autoplay 被浏览器策略拦截时回退(滚动到可视区/首次交互后重试)
  (function () {
    var demos = document.querySelectorAll("video[autoplay]");
    for (var vi = 0; vi < demos.length; vi++) {
      (function (demo) {
        function tryPlay() {
          if (demo.paused) demo.play().catch(function () {});
        }
        tryPlay();
        if ("IntersectionObserver" in window) {
          var vio = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) tryPlay(); });
          }, { threshold: 0.05 });
          vio.observe(demo);
        }
        window.addEventListener("pointerdown", tryPlay, { once: true, passive: true });
        window.addEventListener("keydown", tryPlay, { once: true, passive: true });
      })(demos[vi]);
    }
  })();

  // 6. 锚点跳转后清掉 URL 里的 hash:否则点过一次「下载」,之后每次刷新都会
  //    滚回该锚点(如 #download)。replaceState 只改地址栏,不触发滚动/跳转。
  (function () {
    function cleanHash() {
      if (location.hash) {
        try {
          history.replaceState(null, "", location.pathname + location.search);
        } catch (e) {}
      }
    }
    window.addEventListener("hashchange", cleanHash);
    cleanHash();
  })();

})();
