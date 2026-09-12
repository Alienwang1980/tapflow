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

  // 2b. 3D mockup (mckp.live):进入视口后显示加载转圈;canvas 就绪后隐藏静态占位图
  //     与转圈;加载失败/超时则静态图常驻。canvas 在 shadow DOM 里,普通 observer
  //     看不见 → 轮询 mountPoint 引用。hero 首屏立即观察,duo 滚动进入视口才开始
  //     (mckp 对离屏 player 是懒加载的,提前轮询只会空转到超时)。
  (function () {
    // spinnerSel: 转圈挂载点;hero 用 .hero(播放器 cover 溢出会被裁),duo 用 .duo-player
    function wire(boxSel, posterSel, spinnerSel) {
      var box = document.querySelector(boxSel);
      var poster = document.querySelector(posterSel);
      var spinner = spinnerSel ? document.querySelector(spinnerSel) : box;
      var player = box && box.querySelector("mockup-player");
      if (!box || !poster || !player) return;
      var started = false, tries = 0, t = null;
      function poll() {
        var mp = player.mountPoint;
        if (mp && mp.querySelector("canvas")) {
          poster.style.visibility = "hidden";
          spinner.classList.remove("is-loading");
          clearInterval(t); t = null;
        } else if (++tries > 120) { // ~2 分钟仍未渲染,停止探测,静态图常驻
          spinner.classList.remove("is-loading");
          clearInterval(t); t = null;
        }
      }
      function start() {
        if (started) return;
        started = true;
        spinner.classList.add("is-loading");
        t = setInterval(poll, 1000);
      }
      if ("IntersectionObserver" in window) {
        var o = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) { start(); o.disconnect(); break; }
          }
        }, { threshold: 0.05 });
        o.observe(box);
      } else {
        start();
      }
    }
    wire(".hero-player", ".hero-fallback", ".hero");
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
