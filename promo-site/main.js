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
  //     - poster 静态占位图垫底:首帧前 canvas(alpha:true)透明 → poster 透出;
  //       但 hero 场景背景透明(只有设备,无背景),首帧后 poster 会从设备周围
  //       透出成「背景」穿帮(duo 场景背景不透明,无此问题)→ 在 poster 与
  //       canvas 之间放一张黑底,3D 首帧画上后渐显盖住 poster。
  //     - 首帧检测:hook gl.drawElements/drawArrays,每次绘制后 readPixels 采样
  //       7 点 alpha,首次非 0 即首帧已画 → 渐显黑底。hook 装晚时(静态场景
  //       首帧后不再 draw)派发 resize 触发 mckp 重绘一帧补偿;仍检测不到则
  //       进度条卸载后 8s 强制渐显(加载中 = 黑底 + 居中进度条,不穿帮)。
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

      // 黑底:插在 poster 之后、canvas 容器之前(DOM 顺序:poster → shade → player)
      var shade = document.createElement("div");
      shade.style.cssText = "position:absolute;inset:0;z-index:1;background:#000;" +
        "opacity:0;transition:opacity .25s ease;pointer-events:none;";
      poster.parentNode.insertBefore(shade, poster.nextSibling);
      var done = false;
      function showShade() {
        if (done) return;
        done = true;
        shade.style.opacity = "1";
      }

      var ticks = 0, barGoneAt = 0;
      var t = setInterval(function () {
        var mp = player.mountPoint;
        if (!mp) return;
        if (!mp.__tfStyle) { // 注入一次居中样式
          mp.__tfStyle = true;
          var st = document.createElement("style");
          st.textContent = CENTER_CSS;
          mp.appendChild(st);
        }
        var canvas = mp.querySelector("canvas");
        var bar = mp.querySelector("[role='progressbar']");
        if (canvas && !canvas.__tfGl) {
          canvas.__tfGl = true;
          var gl = null;
          try { gl = canvas.getContext("webgl2") || canvas.getContext("webgl"); } catch (e) {}
          if (gl) {
            var buf = new Uint8Array(4);
            function hasContent() {
              try {
                var W = gl.drawingBufferWidth, H = gl.drawingBufferHeight;
                for (var i = 0; i < 7; i++) {
                  gl.readPixels(Math.floor(W * (0.15 + 0.116 * i)),
                    Math.floor(H * (0.3 + 0.05 * (i % 4))), 1, 1,
                    gl.RGBA, gl.UNSIGNED_BYTE, buf);
                  if (buf[3] > 0) return true;
                }
              } catch (e) {}
              return false;
            }
            function wrap(fn) {
              return function () {
                var r = fn.apply(this, arguments);
                if (!done && hasContent()) showShade();
                return r;
              };
            }
            gl.drawElements = wrap(gl.drawElements);
            gl.drawArrays = wrap(gl.drawArrays);
            // 补偿:场景若已在 hook 前渲染完(静态场景不再 draw),
            // 派发 resize 触发 mckp 重绘一帧
            setTimeout(function () { if (!done) window.dispatchEvent(new Event("resize")); }, 150);
          }
        }
        if (canvas) {
          if (!bar) { // 进度条卸载后 8s 仍未检测到首帧 → 强制渐显(兜底)
            if (!barGoneAt) barGoneAt = ticks;
            else if (ticks - barGoneAt > 8) showShade();
          }
          if (++ticks > 300) clearInterval(t); // 5 分钟硬上限
        }
        if (done) clearInterval(t);
      }, 1000);
    }
    wire(".hero-player", ".hero-fallback");
    wire(".duo-player", ".duo-fallback");
  })();

  // 2c. duo 提前激活:mckp 默认懒激活(IntersectionObserver threshold:0,
  //     滚到才拉 ~3MB 素材 → 到底部干等)。activate() 公开且幂等(重复调用
  //     直接短路),提前在「距视口 1500px」或「load 后 8s」调用,后台预载,
  //     滚动到位即出画面(离屏时 mckp 不渲染,不抢 GPU)。
  (function () {
    var duo = document.querySelector(".duo-player mockup-player");
    if (!duo) return;
    function prewarm() {
      try { duo.activate(); } catch (e) {}
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { prewarm(); io.disconnect(); }
        });
      }, { rootMargin: "1500px 0px" });
      io.observe(duo);
    }
    setTimeout(prewarm, 8000); // 用户停在首屏时也后台预载
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
