/* 直凉圣若望堂 · 页面交互
   No dependencies. Progressive enhancement only. */

(function () {
  "use strict";

  var doc = document;
  var body = doc.body;

  /* ---------- reading progress ---------- */
  var progress = doc.getElementById("progress");
  function updateProgress() {
    if (!progress) return;
    var h = doc.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct.toFixed(2) + "%";
  }

  /* ---------- nav: hide on scroll down, show on up ---------- */
  var nav = doc.getElementById("nav");
  var lastY = window.pageYOffset || 0;
  function updateNav() {
    if (!nav) return;
    var y = window.pageYOffset || 0;
    if (y > 420 && y > lastY + 6) {
      nav.classList.add("is-hidden");
    } else if (y < lastY - 6 || y < 120) {
      nav.classList.remove("is-hidden");
    }
    lastY = y;
  }

  /* ---------- mobile menu ---------- */
  var toggle = doc.getElementById("navToggle");
  var links = doc.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- reveal on scroll ---------- */
  var reveals = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- back to top ---------- */
  var toTop = doc.getElementById("to-top");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function updateTop() {
    if (!toTop) return;
    if ((window.pageYOffset || 0) > 700) toTop.classList.add("show");
    else toTop.classList.remove("show");
  }

  /* ---------- images: mark broken ---------- */
  Array.prototype.forEach.call(doc.querySelectorAll("img"), function (img) {
    img.addEventListener("error", function () {
      img.style.background = "#e7dcc8";
      img.alt = (img.alt || "图片") + "（图片载入失败）";
    });
  });

  /* ---------- lightbox ---------- */
  var lb = doc.getElementById("lightbox");
  var lbImg = doc.getElementById("lbImg");
  var lbCap = doc.getElementById("lbCap");
  var lbCount = doc.getElementById("lbCount");
  var lbClose = doc.getElementById("lbClose");
  var lbPrev = doc.getElementById("lbPrev");
  var lbNext = doc.getElementById("lbNext");

  var items = [];
  var index = 0;

  function collectItems() {
    var nodes = doc.querySelectorAll("[data-full]");
    items = Array.prototype.map.call(nodes, function (node) {
      return {
        full: node.getAttribute("data-full"),
        cap: node.getAttribute("data-cap") || "",
        credit: node.getAttribute("data-credit") || "",
        el: node
      };
    });
    nodes.forEach(function (node, i) {
      node.addEventListener("click", function (e) {
        e.preventDefault();
        openAt(i);
      });
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "button");
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openAt(i);
        }
      });
    });
  }

  function render() {
    if (!items.length || !lbImg) return;
    var item = items[index];
    lbImg.src = item.full;
    lbImg.alt = item.cap;
    lbCap.innerHTML = item.cap + (item.credit ? "<span>" + item.credit + "</span>" : "");
    if (lbCount) lbCount.textContent = (index + 1) + " / " + items.length;
    // preload neighbours
    [index - 1, index + 1].forEach(function (i) {
      if (i >= 0 && i < items.length) {
        var pre = new Image();
        pre.src = items[i].full;
      }
    });
  }

  function openAt(i) {
    if (!lb || !items.length) return;
    index = (i + items.length) % items.length;
    render();
    lb.classList.add("open");
    doc.documentElement.style.overflow = "hidden";
    if (lbClose) lbClose.focus();
  }

  function closeLb() {
    if (!lb) return;
    lb.classList.remove("open");
    doc.documentElement.style.overflow = "";
    if (items[index] && items[index].el) items[index].el.focus();
  }

  function step(delta) {
    if (!items.length) return;
    index = (index + delta + items.length) % items.length;
    render();
  }

  if (lb) {
    collectItems();
    if (lbClose) lbClose.addEventListener("click", closeLb);
    if (lbPrev) lbPrev.addEventListener("click", function () { step(-1); });
    if (lbNext) lbNext.addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb) closeLb();
    });
    doc.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    // touch swipe
    var startX = null;
    lb.addEventListener("touchstart", function (e) {
      if (e.changedTouches && e.changedTouches.length) startX = e.changedTouches[0].clientX;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (startX === null || !e.changedTouches || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) step(dx > 0 ? -1 : 1);
      startX = null;
    }, { passive: true });
  }

  /* ---------- album filters ---------- */
  var filterBtns = Array.prototype.slice.call(doc.querySelectorAll(".filter-btn"));
  var photos = Array.prototype.slice.call(doc.querySelectorAll(".photo"));
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      filterBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
      photos.forEach(function (p) {
        var show = cat === "all" || p.getAttribute("data-cat") === cat;
        p.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---------- keyboard shortcut: "/" focuses nothing; ignore ---------- */

  /* ---------- rAF throttle ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateProgress();
      updateNav();
      updateTop();
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateProgress();
  updateTop();
})();
