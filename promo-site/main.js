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
  //     - 就绪信号:canvas 已建 && 进度条已卸载(素材加载完成)→ 再等 2s
  //       (shader 编译/首帧)才隐藏静态占位图。旧逻辑以「canvas 创建」为信号
  //       太早:canvas 建好后场景/贴图仍在加载,出现"loading 没了却黑屏"的空窗。
  //       用轮询而非 MutationObserver:极快加载时进度条有 350ms 挂载延迟可能
  //       根本不出现,观察"卸载"会永远等不到
  (function () {
    var CENTER_CSS = [
      // 进度条本体 + 其父 overlay 全屏 flex 居中(:has 兜底类名 hash 变化)
      "[role='progressbar'], ._overlay_5nsm1_3, *:has(> [role='progressbar']) {",
      "  position: absolute !important; inset: 0 !important; margin: 0 !important;",
      "  display: flex !important; align-items: center !important; justify-content: center !important;",
      "}",
      "[role='progressbar'] { position: absolute !important; inset: auto !important; width: min(50%, 320px) !important; }"
    ].join("\n");

    function wire(boxSel, posterSel) {
      var box = document.querySelector(boxSel);
      var poster = document.querySelector(posterSel);
      var player = box && box.querySelector("mockup-player");
      if (!box || !poster || !player) return;
      var done = false, ticks = 0;
      var grace = 2000; // 素材加载完 → shader 编译/首帧的宽限
      function onLoaded() {
        if (done) return;
        done = true;
        setTimeout(function () { poster.style.visibility = "hidden"; }, grace);
      }
      var t = setInterval(function () {
        var mp = player.mountPoint;
        if (!mp) return;
        if (!mp.__tfStyle) { // 注入一次居中样式
          mp.__tfStyle = true;
          var st = document.createElement("style");
          st.textContent = CENTER_CSS;
          mp.appendChild(st);
        }
        var hasBar = !!mp.querySelector("[role='progressbar']");
        var hasCanvas = !!mp.querySelector("canvas");
        if (hasCanvas && !hasBar) {
          onLoaded();
          clearInterval(t);
        } else if (hasCanvas && ++ticks > 120) { // canvas 建好后 2 分钟仍未就绪才放弃;
          clearInterval(t);                     // 未激活(无 canvas)不消耗预算(duo 懒加载)
        }
      }, 1000);
    }
    wire(".hero-player", ".hero-fallback");
    wire(".duo-player", ".duo-fallback");
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
