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

  // 2b. Hero 3D mockup (mckp.live):canvas 就绪后隐藏静态占位图;加载失败则静态图常驻
  (function () {
    var box = document.querySelector(".hero-player");
    var poster = document.querySelector(".hero-fallback");
    var player = box && box.querySelector("mockup-player");
    if (!box || !poster) return;
    // player 的 canvas 在 shadow DOM 里,普通 observer 看不见 → 轮询 mountPoint 引用
    var tries = 0;
    var t = setInterval(function () {
      var mp = player && player.mountPoint;
      if (mp && mp.querySelector("canvas")) {
        poster.style.visibility = "hidden";
        clearInterval(t);
      } else if (++tries > 120) { // ~2 分钟仍未渲染,停止探测,静态图常驻
        clearInterval(t);
      }
    }, 1000);
  })();

  // 2c. 双 iPad 3D(下载区上方):同样轮询 canvas,就绪后隐藏静态占位图
  (function () {
    var box = document.querySelector(".duo-player");
    var poster = document.querySelector(".duo-fallback");
    var player = box && box.querySelector("mockup-player");
    if (!box || !poster) return;
    var tries = 0;
    var t = setInterval(function () {
      var mp = player && player.mountPoint;
      if (mp && mp.querySelector("canvas")) {
        poster.style.visibility = "hidden";
        clearInterval(t);
      } else if (++tries > 120) {
        clearInterval(t);
      }
    }, 1000);
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

  // 5. GIF lazy-load: swap static image for the demo GIF when scrolled into view
  var gifImgs = document.querySelectorAll("img[data-gif]");
  if ("IntersectionObserver" in window && gifImgs.length) {
    var gio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var img = e.target;
        img.src = img.getAttribute("data-gif");
        img.removeAttribute("data-gif");
        // 静态图与 GIF 比例不同(1080x678 vs 640x480):换源后清掉 width/height 属性,
        // 让 GIF 按自然比例渲染,避免被属性比例拉伸
        img.removeAttribute("width");
        img.removeAttribute("height");
        gio.unobserve(img);
      });
    }, { threshold: 0.2 });
    gifImgs.forEach(function (img) { gio.observe(img); });
  }

  // 5b. Editor demo video: autoplay 被浏览器策略拦截时回退(滚动到可视区/首次交互后重试)
  (function () {
    var demo = document.querySelector("video.editor-demo");
    if (!demo) return;
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
  })();

})();
