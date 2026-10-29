/* Mogify Studio — site motion & interactions */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js-ready");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- WhatsApp: the number lives only in the link behind the name ---------- */
  var waLink = $("[data-wa]");
  var WA_BASE = waLink ? waLink.getAttribute("href").split("?")[0] : "";
  function waUrl(text) { return WA_BASE + "?text=" + encodeURIComponent(text); }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    doc.classList.add("gsap-on");
  }
  if (hasGsap && !reduce && typeof window.Lenis === "function") {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToTarget(target) {
    var el = typeof target === "string" ? $(target) : target;
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: el.id === "main" ? 0 : -70, duration: 1.3 });
    else el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- Mobile menu ---------- */
  var burger = $(".burger"), menu = $("#menu");
  function setMenu(open) {
    if (!menu) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add("is-open"); }); });
      if (lenis) lenis.stop();
      document.body.style.overflow = "hidden";
    } else {
      menu.classList.remove("is-open");
      if (lenis) lenis.start();
      document.body.style.overflow = "";
      setTimeout(function () { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduce ? 0 : 650);
    }
  }
  if (burger) burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });

  /* In-page links */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var el = $(id);
    if (!el) return;
    e.preventDefault();
    var wasOpen = menu && menu.classList.contains("is-open");
    if (wasOpen) setMenu(false);
    setTimeout(function () { scrollToTarget(el); }, wasOpen ? 250 : 0);
  });

  /* ---------- Header ---------- */
  var hdr = $(".hdr"), lastY = 0;
  function onScrollHeader() {
    var y = window.scrollY || window.pageYOffset;
    hdr.classList.toggle("is-solid", y > 30);
    var menuOpen = menu && menu.classList.contains("is-open");
    if (!menuOpen) hdr.classList.toggle("is-hidden", y > 700 && y > lastY + 2);
    if (y < lastY - 2 || y < 700) hdr.classList.remove("is-hidden");
    lastY = y;
    var wa = $(".wa-float");
    if (wa) {
      var c = $("#contact"), r = c ? c.getBoundingClientRect() : null;
      var inContact = r && r.top < window.innerHeight * 0.6 && r.bottom > 0;
      wa.classList.toggle("is-away", y < 260 || inContact);
    }
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* Active nav link */
  var navLinks = $$(".nav a");
  if ("IntersectionObserver" in window && navLinks.length) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) navLinks.forEach(function (l) { l.classList.toggle("is-on", l.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (l) { var s = $(l.getAttribute("href")); if (s) navIO.observe(s); });
  }

  /* ---------- Hero canvas: a living dot field ---------- */
  (function heroField() {
    var cv = $(".hero-canvas");
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], gap = 34, mx = -9999, my = -9999, t0 = performance.now(), running = false, raf = 0;
    function build() {
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 640 ? 28 : 36;
      pts = [];
      for (var y = gap / 2; y < H + gap; y += gap) for (var x = gap / 2; x < W + gap; x += gap) pts.push([x, y]);
    }
    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], x = p[0], y = p[1];
        var wave = reduce ? 0 : Math.sin(x * 0.012 + t * 1.1) * Math.cos(y * 0.014 - t * 0.8);
        var dx = x - mx, dy = y - my, d = Math.sqrt(dx * dx + dy * dy), f = 0;
        if (d < 170) { f = (1 - d / 170); x += dx / (d || 1) * f * 26; y += dy / (d || 1) * f * 26; }
        var a = 0.10 + (wave + 1) * 0.07 + f * 0.65;
        var s = 1 + (wave + 1) * 0.45 + f * 2.2;
        ctx.fillStyle = f > 0.05 ? "rgba(0,169,157," + Math.min(a + 0.15, 1).toFixed(3) + ")" : "rgba(255,255,255," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(x, y + wave * 5, s, 0, 6.2832); ctx.fill();
      }
      if (running && !reduce) raf = requestAnimationFrame(draw);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(draw); } }
    function stop() { running = false; cancelAnimationFrame(raf); }
    build(); draw(performance.now());
    window.addEventListener("resize", function () { build(); if (!running) draw(performance.now()); });
    var hero = $(".hero");
    if (finePointer) hero.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    hero.addEventListener("pointerleave", function () { mx = my = -9999; });
    if (reduce) return;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }).observe(hero);
    else start();
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  })();

  /* ---------- Lazy videos ---------- */
  function loadVideo(v) {
    if (v.dataset.loaded) return;
    $$("source[data-src]", v).forEach(function (s) { s.src = s.dataset.src; });
    v.load(); v.dataset.loaded = "1";
  }
  var lazyVids = $$(".lazy-video");
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { loadVideo(v); if (!reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) v.pause();
      });
    }, { rootMargin: "200px 0px", threshold: 0.15 });
    lazyVids.forEach(function (v) { vio.observe(v); });
  } else lazyVids.forEach(loadVideo);
  var pillVid = $(".pill-video");
  if (pillVid && reduce) { pillVid.removeAttribute("autoplay"); pillVid.pause(); }

  /* ---------- Modals: shared helpers ---------- */
  var lastFocus = null;
  function openModal(m) {
    lastFocus = document.activeElement;
    m.hidden = false;
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
    var c = $(".lb-close", m); if (c) c.focus();
    if (hasGsap && !reduce) gsap.fromTo(m, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
  }
  function closeModal(m) {
    var done = function () { m.hidden = true; if (lenis) lenis.start(); document.body.style.overflow = ""; if (lastFocus) lastFocus.focus({ preventScroll: true }); };
    if (hasGsap && !reduce) gsap.to(m, { opacity: 0, duration: 0.25, onComplete: done }); else done();
  }
  function trapTab(m, e) {
    if (e.key !== "Tab") return;
    var f = $$("button, [href], video[controls]", m).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Work archive: filters, show more, lightbox ---------- */
  var grid = $("#w-grid"), items = $$(".w-item"), moreBtn = $("#more"), fBtns = $$(".f-btn"), ind = $(".f-ind");
  var PAGE = window.innerWidth < 640 ? 12 : 16, shown = PAGE, filter = "all";
  function matching() { return items.filter(function (li) { return filter === "all" || li.dataset.cat === filter; }); }
  function applyFilter(animate) {
    var list = matching(), newly = [];
    items.forEach(function (li) {
      var idx = list.indexOf(li), vis = idx > -1 && idx < shown;
      if (vis && li.classList.contains("is-hidden")) newly.push(li);
      li.classList.toggle("is-hidden", !vis);
    });
    if (moreBtn) moreBtn.parentNode.hidden = list.length <= shown;
    if (moreBtn) $("span", moreBtn).textContent = "Show more work (" + (list.length - Math.min(shown, list.length)) + " more)";
    if (animate && hasGsap && !reduce && newly.length) gsap.fromTo(newly, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.04, clearProps: "transform,opacity" });
    if (hasGsap) ScrollTrigger.refresh();
  }
  function moveInd() {
    if (!ind) return;
    var a = $(".f-btn.is-active");
    if (!a) return;
    ind.style.width = a.offsetWidth + "px"; ind.style.height = a.offsetHeight + "px";
    ind.style.transform = "translate(" + a.offsetLeft + "px," + a.offsetTop + "px)";
  }
  fBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      fBtns.forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      filter = b.dataset.filter; shown = PAGE; moveInd(); applyFilter(true);
    });
  });
  if (moreBtn) moreBtn.addEventListener("click", function () { shown += PAGE; applyFilter(true); });
  window.addEventListener("resize", moveInd);
  if (items.length) { applyFilter(false); moveInd(); if (document.fonts) document.fonts.ready.then(moveInd); }

  var lb = $("#lb"), lbImg = $("#lb-img"), lbT = $("#lb-title"), lbS = $("#lb-sub"), lbC = $("#lb-count");
  var cards = $$(".w-card"), lbList = [], lbI = 0;
  function showLb(i) {
    lbI = (i + lbList.length) % lbList.length;
    var c = lbList[lbI], img = $("img", c);
    lbImg.src = c.dataset.full; lbImg.alt = img ? img.alt : "";
    lbT.textContent = c.dataset.title; lbS.textContent = c.dataset.sub;
    lbC.textContent = String(lbI + 1).padStart(2, "0") + " / " + String(lbList.length).padStart(2, "0");
    if (hasGsap && !reduce) gsap.fromTo(lbImg, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power3.out" });
    var n = lbList[(lbI + 1) % lbList.length]; if (n) { var pre = new Image(); pre.src = n.dataset.full; }
  }
  function openLbFromIndex(globalIndex, scoped) {
    if (scoped) lbList = cards.filter(function (c) { return filter === "all" || c.parentNode.dataset.cat === filter; });
    else lbList = cards.slice();
    var target = cards[globalIndex], i = lbList.indexOf(target);
    if (i < 0) { lbList = cards.slice(); i = globalIndex; }
    openModal(lb); showLb(i);
  }
  cards.forEach(function (c, i) { c.addEventListener("click", function () { openLbFromIndex(i, true); }); });
  $$(".h-btn").forEach(function (b) { b.addEventListener("click", function () { openLbFromIndex(parseInt(b.dataset.index, 10), false); }); });
  if (lb) {
    $(".lb-prev", lb).addEventListener("click", function () { showLb(lbI - 1); });
    $(".lb-next", lb).addEventListener("click", function () { showLb(lbI + 1); });
    $$("[data-close]", lb).forEach(function (x) { x.addEventListener("click", function () { closeModal(lb); }); });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) showLb(lbI + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* Video modal */
  var vm = $("#vm"), vmV = $("#vm-video"), vmT = $("#vm-title");
  $$(".reel-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var pv = $("video", b);
      vmV.poster = pv ? pv.getAttribute("poster") : "";
      vmV.src = b.dataset.hd; vmT.textContent = b.dataset.title;
      openModal(vm);
      vmV.muted = false;
      var p = vmV.play(); if (p && p.catch) p.catch(function () {});
    });
  });
  if (vm) $$("[data-close]", vm).forEach(function (x) { x.addEventListener("click", function () { vmV.pause(); vmV.removeAttribute("src"); vmV.load(); closeModal(vm); }); });

  document.addEventListener("keydown", function (e) {
    if (lb && !lb.hidden) {
      if (e.key === "Escape") closeModal(lb);
      else if (e.key === "ArrowRight") showLb(lbI + 1);
      else if (e.key === "ArrowLeft") showLb(lbI - 1);
      trapTab(lb, e);
    } else if (vm && !vm.hidden) {
      if (e.key === "Escape") { vmV.pause(); vmV.removeAttribute("src"); vmV.load(); closeModal(vm); }
      trapTab(vm, e);
    } else if (menu && menu.classList.contains("is-open") && e.key === "Escape") { setMenu(false); burger.focus(); }
  });

  /* ---------- Social tiles: fill grows from the pointer ---------- */
  $$(".soc").forEach(function (a) {
    a.addEventListener("pointerenter", function (e) {
      var r = a.getBoundingClientRect();
      a.style.setProperty("--mx", (e.clientX - r.left) + "px");
      a.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Contact form ---------- */
  var form = $("#c-form"), err = $("#f-err");
  function collect() {
    var name = $("#f-name").value.trim(), email = $("#f-email").value.trim(), msg = $("#f-msg").value.trim();
    var needs = $$('input[name="need"]:checked', form).map(function (x) { return x.value; });
    if (!name || !msg) {
      err.textContent = !name ? "Please add your name." : "Please tell us a little about the project.";
      err.hidden = false; (!name ? $("#f-name") : $("#f-msg")).focus(); return null;
    }
    err.hidden = true;
    return { name: name, email: email, msg: msg, needs: needs };
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = collect(); if (!d) return;
      var body = "Hi Mogify Studio,\n\n" + d.msg + "\n\n" + (d.needs.length ? "I need: " + d.needs.join(", ") + "\n" : "") + "Name: " + d.name + (d.email ? "\nEmail: " + d.email : "");
      window.location.href = "mailto:" + form.dataset.email + "?subject=" + encodeURIComponent("New project enquiry from " + d.name) + "&body=" + encodeURIComponent(body);
    });
    var waBtn = $('[data-send="wa"]', form);
    if (waBtn) waBtn.addEventListener("click", function () {
      var d = collect(); if (!d) return;
      var text = "Hi Moiz, I found you on the Mogify Studio website.\n\n" + d.msg + (d.needs.length ? "\n\nI need: " + d.needs.join(", ") : "") + "\n\n" + d.name + (d.email ? " (" + d.email + ")" : "");
      window.open(waUrl(text), "_blank", "noopener");
    });
  }


  /* ---------- Websites: hover-scroll distance per card ---------- */
  function setWebVh() { $$(".web-card .bf-view").forEach(function (v) { v.parentNode.style.setProperty("--vh", v.clientHeight + "px"); }); }
  setWebVh(); window.addEventListener("resize", setWebVh); window.addEventListener("load", setWebVh);

  /* ---------- Inspiration: graceful fallback when a studio's preview image will not load ---------- */
  $$(".insp-img img").forEach(function (img) {
    function bad() { img.parentNode.classList.add("noimg"); }
    img.addEventListener("error", bad);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) bad();
  });

  /* ---------- Motion lab: tiles run only while on screen ---------- */
  var labTiles = $$(".lab-tile");
  if (!reduce && "IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle("is-live", x.isIntersecting); if (x.target.classList.contains("t-flow")) flow.toggle(x.isIntersecting); }); }, { threshold: 0.2 });
    labTiles.forEach(function (t) { lio.observe(t); });
  }
  var flow = (function () {
    var cv = $(".flow-cv"); if (!cv || !cv.getContext) return { toggle: function () {} };
    var ctx = cv.getContext("2d"), W = 0, H = 0, P = [], run = false, raf = 0, t = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#070b13"; ctx.fillRect(0, 0, W, H);
      P = []; for (var i = 0; i < (W < 300 ? 260 : 520); i++) P.push({ x: Math.random() * W, y: Math.random() * H, h: Math.random() }); }
    function step() {
      t += 0.004; ctx.fillStyle = "rgba(7,11,19,0.08)"; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i], a = (Math.sin(p.x * 0.008 + t) + Math.cos(p.y * 0.01 - t * 1.3)) * Math.PI;
        var nx = p.x + Math.cos(a) * 1.4, ny = p.y + Math.sin(a) * 1.4;
        ctx.strokeStyle = p.h > 0.75 ? "rgba(255,255,255,.55)" : "rgba(0,169,157," + (0.35 + p.h * 0.5).toFixed(2) + ")";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) { p.x = Math.random() * W; p.y = Math.random() * H; }
      }
      if (run) raf = requestAnimationFrame(step);
    }
    size(); for (var k = 0; k < 120; k++) step();
    window.addEventListener("resize", function () { size(); for (var k = 0; k < 60; k++) step(); });
    return { toggle: function (on) { if (reduce) return; if (on && !run) { run = true; raf = requestAnimationFrame(step); } else if (!on) { run = false; cancelAnimationFrame(raf); } } };
  })();

  /* ---------- Custom cursor + magnetic buttons (desktop) ---------- */
  if (finePointer && !reduce && hasGsap) {
    doc.classList.add("has-cursor");
    var cur = $(".cursor"), dot = $(".c-dot"), ring = $(".c-ring"), lab = $(".c-label");
    var dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    var rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    window.addEventListener("pointermove", function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.remove("is-hidden"); }, { passive: true });
    document.addEventListener("pointerleave", function () { cur.classList.add("is-hidden"); });
    document.addEventListener("pointerover", function (e) {
      var l = e.target.closest && e.target.closest("[data-cursor]");
      var k = e.target.closest && e.target.closest("a, button, label, input, textarea");
      cur.classList.toggle("is-label", !!l);
      cur.classList.toggle("is-link", !l && !!k);
      lab.textContent = l ? l.dataset.cursor : "";
    });
    $$(".magnetic").forEach(function (el) {
      var mxq = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }), myq = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      el.addEventListener("pointermove", function (e) { var r = el.getBoundingClientRect(); mxq((e.clientX - r.left - r.width / 2) * 0.28); myq((e.clientY - r.top - r.height / 2) * 0.35); });
      el.addEventListener("pointerleave", function () { mxq(0); myq(0); });
    });
    $$(".reel-btn").forEach(function (b) {
      var f = $(".reel-frame", b);
      var tx = gsap.quickTo(f, "rotationY", { duration: 0.6, ease: "power3" }), ty = gsap.quickTo(f, "rotationX", { duration: 0.6, ease: "power3" });
      b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); tx(((e.clientX - r.left) / r.width - 0.5) * 14); ty(-((e.clientY - r.top) / r.height - 0.5) * 10); });
      b.addEventListener("pointerleave", function () { tx(0); ty(0); });
    });
  }

  /* ---------- Hero word rotator (width follows the word) ---------- */
  (function rotator() {
    var rot = $(".rotator"), tr = $(".rot-track");
    if (!tr) return;
    var words = Array.prototype.slice.call(tr.children), n = words.length - 1, i = 0;
    function fit() { var w = words[i].scrollWidth || words[i].getBoundingClientRect().width; if (w) rot.style.width = Math.ceil(w) + "px"; }
    words.forEach(function (s) { s.style.width = "max-content"; });
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
    window.addEventListener("resize", fit);
    if (reduce) return;
    setInterval(function () {
      i++;
      tr.style.transition = "transform .7s cubic-bezier(.22,1,.36,1)";
      tr.style.transform = "translateY(" + (-i * 1.55) + "em)";
      fit();
      if (i === n) setTimeout(function () { tr.style.transition = "none"; tr.style.transform = "translateY(0)"; i = 0; fit(); }, 750);
    }, 2200);
  })();

  /* ---------- Without GSAP or with reduced motion: everything is already visible ---------- */
  var loader = $("#loader");
  function killLoader() { if (loader) loader.style.display = "none"; }
  if (!hasGsap) { killLoader(); return; }

  var heroIntro = buildHeroIntro();
  var seen = false;
  try { seen = sessionStorage.getItem("mgfy-intro") === "1"; } catch (e) {}
  if (reduce) { killLoader(); }
  else if (seen) { killLoader(); heroIntro.play(); }
  else runLoader();

  function runLoader() {
    try { sessionStorage.setItem("mgfy-intro", "1"); } catch (e) {}
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);
    var num = $("#ld-num"), obj = { v: 0 }, loaded = document.readyState === "complete";
    window.addEventListener("load", function () { loaded = true; });
    var tl = gsap.timeline();
    tl.set(".ld-mark", { clipPath: "inset(100% 0 0 0)" })
      .set(".ld-word img", { xPercent: -105 })
      .to(".ld-mark", { clipPath: "inset(0% 0 0 0)", duration: 0.9, ease: "expo.out" }, 0.1)
      .to(".ld-word img", { xPercent: 0, duration: 0.9, ease: "expo.out" }, 0.45)
      .to(obj, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: function () { num.textContent = Math.round(obj.v); } }, 0)
      .to("#ld-bar", { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
      .add(function () { if (!loaded) { tl.pause(); var go = function () { tl.resume(); }; window.addEventListener("load", go); setTimeout(go, 1200); } }, 1.55)
      .to(".ld-center, .ld-foot", { y: -40, opacity: 0, duration: 0.5, ease: "power3.in" }, 1.6)
      .to(".ld-panel", { yPercent: -100, duration: 0.7, ease: "expo.inOut" }, 1.75)
      .to(loader, { yPercent: -100, duration: 0.9, ease: "expo.inOut" }, 2.15)
      .add(function () { heroIntro.play(); }, 2.35)
      .add(function () { killLoader(); if (lenis) lenis.start(); }, 3.1);
  }

  function buildHeroIntro() {
    var tl = gsap.timeline({ paused: true });
    var chars = [];
    if (window.SplitText && !reduce) {
      $$(".hero-title .split").forEach(function (el) {
        var sp = SplitText.create(el, { type: "chars", mask: "chars", charsClass: "ch" });
        chars = chars.concat(sp.chars);
      });
    }
    if (reduce) return tl;
    gsap.set(".h-anim", { opacity: 0, y: 26 });
    gsap.set(".pill", { scaleX: 0, opacity: 1, y: 0 });
    if (chars.length) gsap.set(chars, { yPercent: 110 });
    tl.to(chars, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.025 }, 0)
      .to(".eyebrow", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0)
      .to(".pill", { scaleX: 1, duration: 1.1, ease: "expo.inOut" }, 0.25)
      .to(".hero-lede, .hero-cta, .scroll-hint", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 0.55);
    return tl;
  }

  if (reduce) { ScrollTrigger.refresh(); return; }

  /* ---------- Scroll choreography ---------- */
  // hero drift
  gsap.to(".hero-in", { yPercent: 18, opacity: 0.25, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-glow", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  // marquee, reacting to scroll velocity
  $$(".marquee").forEach(function (m, k) {
    var track = $(".m-track", m), dir = k === 0 ? -1 : 1;
    var tw = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: k === 0 ? 34 : 42, ease: "none", repeat: -1 });
    ScrollTrigger.create({ trigger: m, start: "top bottom", end: "bottom top", onUpdate: function (self) {
      var v = self.getVelocity() / 300; var sc = gsap.utils.clamp(-4, 4, 1 + Math.abs(v)) * (self.direction || 1);
      gsap.to(tw, { timeScale: sc, duration: 0.2, overwrite: true, onComplete: function () { gsap.to(tw, { timeScale: self.direction || 1, duration: 1.2 }); } });
    } });
  });

  // section headings: line reveals
  if (window.SplitText) {
    $$(".split-lines").forEach(function (el) {
      SplitText.create(el, { type: "lines", mask: "lines", linesClass: "ln", autoSplit: true, onSplit: function (self) {
        return gsap.from(self.lines, { yPercent: 105, duration: 1.1, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 86%", once: true } });
      } });
    });
    // statement fills word by word
    $$(".scrub").forEach(function (el) {
      var sp = SplitText.create(el, { type: "words", wordsClass: "wd" });
      gsap.to(sp.words, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } });
    });
  }
  $$(".reveal-up").forEach(function (el) {
    gsap.from(el, { y: 44, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // founder portrait
  gsap.fromTo(".founder-img", { clipPath: "inset(100% 0 0 0 round 24px)" }, { clipPath: "inset(0% 0 0 0 round 24px)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".founder", start: "top 85%", once: true } });
  gsap.fromTo(".founder-img img", { yPercent: -8 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });

  // counters (real counts of what is on this page)
  $$(".count").forEach(function (el) {
    var to = parseInt(el.dataset.to, 10), o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: function () {
      gsap.to(o, { v: to, duration: 1.6, ease: "power3.out", onUpdate: function () { el.textContent = Math.round(o.v); } });
    } });
  });

  // service cards: rise in; on desktop each earlier card recedes as the next slides over it
  var svc = $$(".svc-card");
  svc.forEach(function (card) {
    gsap.from($(".svc-inner", card), { y: 80, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 92%", once: true } });
  });
  gsap.matchMedia().add("(min-width: 901px)", function () {
    svc.forEach(function (card, i) {
      if (i === svc.length - 1) return;
      gsap.to($(".svc-inner", card), { scale: 0.95, filter: "brightness(.78)", ease: "none", scrollTrigger: { trigger: svc[i + 1], start: "top 75%", end: "top 20%", scrub: true } });
    });
  });

  // hero: floating real work, drifting with the pointer and the scroll
  if ($(".hero-float")) {
    gsap.from(".hf", { y: 120, opacity: 0, rotation: 0, duration: 1.4, ease: "expo.out", stagger: 0.12, delay: seen ? 0.3 : 2.6 });
    $$(".hf").forEach(function (h, i) { gsap.to(h, { y: i % 2 ? 14 : -14, duration: 3 + i * 0.6, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 3 }); });
    gsap.to(".hero-float", { yPercent: -22, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (finePointer) {
      var hfx = gsap.quickTo(".hero-float", "x", { duration: 1.2, ease: "power3" }), hfr = gsap.quickTo(".hero-float", "rotationY", { duration: 1.2, ease: "power3" });
      $(".hero").addEventListener("pointermove", function (e) { var p = e.clientX / window.innerWidth - 0.5; hfx(p * -30); hfr(p * 10); });
    }
  }

  // horizontal featured gallery (desktop)
  var mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", function () {
    var work = $(".work"), track = $(".h-track"), pin = $(".h-pin");
    work.classList.add("pin-on");
    function dist() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    var tw = gsap.to(track, { x: function () { return -dist(); }, ease: "none", scrollTrigger: {
      trigger: pin, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: function (self) { gsap.set(".h-progress span", { scaleX: self.progress }); }
    } });
    $$(".h-img img").forEach(function (img) {
      gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: img.closest(".h-card"), containerAnimation: tw, start: "left right", end: "center center", scrub: true } });
    });
    return function () { work.classList.remove("pin-on"); gsap.set(track, { clearProps: "transform" }); };
  });
  mm.add("(max-width: 900px)", function () {
    gsap.from(".h-card", { x: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: ".h-list", start: "top 85%", once: true } });
  });

  // archive cards rise in as they enter
  ScrollTrigger.batch(".w-item", { start: "top 92%", once: true, onEnter: function (b) {
    var vis = b.filter(function (x) { return !x.classList.contains("is-hidden"); });
    if (!vis.length) return;
    gsap.fromTo(vis, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.06, clearProps: "transform,opacity" });
  } });

  // reels straighten up from a 3D tilt
  gsap.from(".reel-frame", { rotationY: function (i) { return i % 2 ? -18 : 18; }, rotationX: 8, y: 80, opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: ".reels", start: "top 85%", once: true } });


  // product: laptop rises, phones cascade
  gsap.from(".pd-phone", { y: 90, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".pd-phones", start: "top 88%", once: true } });
  gsap.fromTo(".laptop", { rotationX: 18, transformPerspective: 1400, transformOrigin: "50% 100%" }, { rotationX: 0, ease: "none", scrollTrigger: { trigger: ".pd-laptop", start: "top 95%", end: "center 60%", scrub: true } });
  // motion lab + inspiration
  gsap.from(".lab-tile", { y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.07, scrollTrigger: { trigger: ".lab-grid", start: "top 88%", once: true } });
  gsap.from(".insp-grid li", { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.05, scrollTrigger: { trigger: ".insp-grid", start: "top 88%", once: true } });

  // process: line draws, number flips, steps light up
  gsap.to(".proc-line span", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 60%", end: "bottom 60%", scrub: true } });
  var steps = $$(".step");
  steps.forEach(function (st, i) {
    gsap.from(st, { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: st, start: "top 88%", once: true } });
    ScrollTrigger.create({ trigger: st, start: "top 60%", end: "bottom 60%", onToggle: function (self) {
      if (self.isActive) { st.classList.add("is-on"); gsap.to(".pb-track", { yPercent: -25 * i, duration: 0.8, ease: "expo.out" }); }
    } });
  });

  // social tiles cascade
  gsap.from(".soc-grid li", { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", stagger: { each: 0.06, grid: "auto", from: "start" }, scrollTrigger: { trigger: ".soc-grid", start: "top 88%", once: true } });

  // contact & footer
  gsap.from(".c-wa, .c-mail, .c-soc, .c-form", { y: 50, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".contact-grid", start: "top 88%", once: true } });
  gsap.from(".ftr-big-a", { yPercent: 40, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".ftr", start: "top 85%", once: true } });

  if (document.fonts) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
