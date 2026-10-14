/* FMR'27 — rendering + animation. Content comes from data.js */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const S = window.SITE;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = !!window.gsap && !!window.ScrollTrigger;

  /* ================= RENDER FROM DATA ================= */
  $("#heroName").textContent = S.name;
  $("#heroRoll").textContent = S.roll;
  $("#heroTag").textContent = S.tagline;
  $("#footName").textContent = S.name + " · " + S.roll;

  // Timeline
  const T = window.TIMELINE;
  $("#tlTot").textContent = String(T.length).padStart(2, "0");
  $("#tlTrack").innerHTML = T.map((t, i) => `
    <div class="tl-col" data-i="${i}">
      <div class="tl-label"><b>${t.month}</b><span${t.week ? "" : ' style="visibility:hidden"'}>${t.week || "."}</span><em>${t.year}</em></div>
      <div class="tl-node"><i class="tl-dot"></i></div>
      <article class="tl-card">
        <div class="tl-top"><span class="tl-idx">${String(i + 1).padStart(2, "0")}</span></div>
        <h3>${t.title}</h3>
        ${t.points && t.points.length ? `<ul>${t.points.map(p => `<li>${p}</li>`).join("")}</ul>` : ""}
      </article>
    </div>`).join("");

  // Changes + new initiatives
  const card = (x, i) => `<div class="imp-card"><span class="idx">${String(i + 1).padStart(2, "0")}</span><h3>${x.title}</h3><p>${x.text}</p></div>`;
  $("#impGrid").innerHTML = window.CHANGES.map(card).join("");
  $("#initGrid").innerHTML = window.NEW_INITIATIVES.map(card).join("");

  // Initiative plans: tabs + month bar + deadlines
  const PL = window.INIT_PLANS, PM = window.INIT_MONTHS;
  $("#planTabs").innerHTML = PL.map((p, i) => `<button class="chip${i === 0 ? " on" : ""}" data-i="${i}">${p.title}</button>`).join("");
  function renderPlan(i) {
    const p = PL[i];
    $("#planPanel").innerHTML = `
      <div class="plan-head"><div><h4>${p.title}</h4><p>${p.blurb}</p></div><span class="plan-count">${p.tasks.length} sub-tasks</span></div>
      ${p.team ? `<div class="plan-team"><small>${p.teamLabel || "Team"}</small>${p.team.map(n => `<span>${n}</span>`).join("")}${p.why ? `<em class="why"><b>Why this team:</b> ${p.why}</em>` : ""}</div>` : ""}
      <div class="plan-months">${PM.map((m, k) => `<span class="${k >= p.start && k <= p.end ? "in" : ""}">${m}</span>`).join("")}<i class="plan-fill" style="left:${p.start / PM.length * 100}%;width:${(p.end - p.start + 1) / PM.length * 100}%"></i></div>
      <ol class="plan-list">${p.tasks.map((t, k) => `<li><span class="when">${t.when}</span><span class="what">${t.task}</span><span class="n">${String(k + 1).padStart(2, "0")}</span></li>`).join("")}</ol>`;
    if (window.gsap) {
      gsap.from("#planPanel .plan-fill", { scaleX: 0, transformOrigin: "0 50%", duration: .9, ease: "power3.out" });
      gsap.from("#planPanel .plan-list li", { x: -30, opacity: 0, duration: .5, stagger: .06, ease: "power3.out", clearProps: "transform,opacity" });
    }
  }
  renderPlan(0);
  $("#planTabs").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$("#planTabs .chip").forEach(c => c.classList.toggle("on", c === b));
    renderPlan(+b.dataset.i);
  });

  // Database
  const DB = window.DATABASE, CATS = window.DB_CATEGORIES;
  const stat = (v, suf, label) => `<div class="stat"><b data-count="${v}" data-suf="${suf || ""}">0</b><span>${label}</span></div>`;
  $("#dbStats").innerHTML =
    stat(DB.length, "", "Companies in the database") +
    stat(DB.filter(d => d.status === "New").length, "", "New leads (not in FMR'26)") +
    stat(CATS.length, "", "Domains covered") +
    stat(DB.filter(d => d.prev).length, "", "Last year's converts");
  let dbCat = "All", dbQ = "", dbNew = false;
  $("#dbChips").innerHTML = ["All", ...CATS].map(c => `<button class="chip${c === "All" ? " on" : ""}" data-c="${c}">${c}</button>`).join("");
  function renderDB(animate) {
    const q = dbQ.toLowerCase();
    const rows = DB.filter(d => (dbCat === "All" || d.cat === dbCat) && (!dbNew || d.status === "New") && (!q || (d.name + d.cat + d.src).toLowerCase().includes(q)));
    $("#dbCount").textContent = rows.length + " of " + DB.length;
    $("#dbTable").innerHTML = `
      <div class="db-row head"><span>Name</span><span>Domain</span><span class="hide-m">Source</span><span>Status</span><span class="hide-m">Notes</span></div>` +
      (rows.length ? rows.map(d => `
      <div class="db-row">
        <span class="nm">${d.site ? `<a href="${/^https?:/.test(d.site) ? d.site : "https://" + d.site}" target="_blank" rel="noopener">${d.name}</a>` : d.name}</span>
        <span class="mut">${d.cat}</span><span class="mut hide-m">${d.src}</span>
        <span><span class="pill ${d.status === "New" ? "new" : "alloc"}">${d.status}</span></span>
        <span class="mut hide-m db-note">${d.prev ? "Last year's convert" + (d.port ? " · " + d.port : "") : ""}</span>
      </div>`).join("") : `<div class="db-empty">Nothing here.</div>`);
    if (animate && hasGsap) gsap.from("#dbTable .db-row:not(.head)", { y: 24, opacity: 0, duration: .5, stagger: .02, ease: "power3.out", clearProps: "transform,opacity" });
  }
  renderDB();
  $("#dbChips").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$("#dbChips .chip").forEach(c => c.classList.toggle("on", c === b));
    dbCat = b.dataset.c; renderDB(true);
  });
  $("#dbSearch").addEventListener("input", e => { dbQ = e.target.value.trim(); renderDB(false); });
  $("#dbNew").addEventListener("click", e => { dbNew = !dbNew; e.currentTarget.classList.toggle("on", dbNew); renderDB(true); });

  // Initiative
  const I = window.INITIATIVE;
  const fmtMsg = t => t.replace(/\*(.+?)\*/g, "<b>$1</b>").replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  $("#iniChat").innerHTML = I.chat.map(m => '<div class="msg' + (m.from === "You" ? " me" : "") + '" data-copy="' + encodeURIComponent(m.text) + '"><span class="who">' + m.from + '</span>' + fmtMsg(m.text) + '<span class="cp">tap to copy</span><span class="tm">' + m.time + '</span></div>').join("");
  $("#iniChat").addEventListener("click", e => {
    const m = e.target.closest(".msg"); if (!m) return;
    navigator.clipboard?.writeText(decodeURIComponent(m.dataset.copy));
    const c = $(".cp", m); c.textContent = "copied ✓"; c.style.opacity = 1;
    setTimeout(() => { c.textContent = "tap to copy"; c.style.opacity = ""; }, 1200);
  });

  // Collabs
  $("#collabGrid").innerHTML = window.COLLABS.map(c => `
    <div class="cg"><h4>${c.team}</h4><p>${c.blurb}</p>${c.points && c.points.length ? `<ul>${c.points.map(p => `<li>${p}</li>`).join("")}</ul>` : ""}</div>`).join("");
  const n = window.COLLABS.length;
  $("#orbit").insertAdjacentHTML("beforeend", window.COLLABS.map((c, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `<div class="orbit-node" style="left:${50 + 50 * Math.cos(a)}%;top:${50 + 50 * Math.sin(a)}%"><span>${c.team}</span></div>`;
  }).join(""));

  /* ================= SPLIT HEADINGS INTO WORDS ================= */
  function splitWords(el) {
    const out = [];
    [...el.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          if (/^\s+$/.test(w)) out.push(document.createTextNode(" "));
          else out.push(Object.assign(document.createElement("span"), { className: "word", innerHTML: `<span>${w}</span>` }));
        });
      } else if (node.nodeName === "BR") out.push(node);
      else { const w = document.createElement("span"); w.className = "word"; const inner = document.createElement("span"); inner.appendChild(node.cloneNode(true)); w.appendChild(inner); out.push(w); }
    });
    el.textContent = ""; out.forEach(o => el.appendChild(o));
  }
  $$(".split-text").forEach(splitWords);

  // counters
  const fmt = (v, suf) => Math.round(v) + suf;

  /* ================= ANIMATION ================= */
  const nav = $("#nav");
  if (!hasGsap || reduce) {
    $$("[data-count]").forEach(b => b.textContent = fmt(b.dataset.count, b.dataset.suf));
    $$(".tl-col").forEach(c => c.classList.add("on"));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // smooth scroll
  let lenis = null, navLock = false, navLockT = 0, lastY = 0;
  // jump to a section: smooth via Lenis, with a plain-scroll fallback; the nav stays visible while travelling
  const goTo = y => {
    const from = scrollY;
    navLock = true; nav.classList.remove("hide");
    clearTimeout(navLockT); navLockT = setTimeout(() => { navLock = false; }, 1800);
    y = Math.max(0, Math.round(y));
    if (lenis) {
      lenis.scrollTo(y, { duration: 1.3 });
      setTimeout(() => { if (Math.abs(scrollY - from) < 2 && Math.abs(scrollY - y) > 2) window.scrollTo(0, y); }, 300);
    } else window.scrollTo({ top: y, behavior: "smooth" });
  };
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href"); const t = id === "#" ? null : $(id);
      if (!t) return; e.preventDefault();
      goTo(id === "#top" ? 0 : t.getBoundingClientRect().top + scrollY - (id === "#timeline" ? 0 : 10));
    }));
    lenis.on("scroll", ({ scroll }) => {
      if (navLock) nav.classList.remove("hide"); else nav.classList.toggle("hide", scroll > lastY && scroll > 300);
      lastY = scroll;
    });
  }

  // progress bar
  gsap.to(".scroll-progress span", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });


  // hero intro
  gsap.set(".hero-title .inner", { yPercent: 115, rotate: 4 });
  gsap.timeline({ defaults: { ease: "power4.out" } })
    .to(".hero-title .inner", { yPercent: 0, rotate: 0, duration: 1.4, stagger: .15, delay: .15 })
    .from(".reveal-hero", { y: 30, opacity: 0, duration: 1, stagger: .12 }, "-=.9");
  gsap.to(".hero-title", { yPercent: -18, opacity: .1, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  $$(".sh").forEach((s, i) => gsap.to(s, { yPercent: (i % 2 ? -1 : 1) * (60 + i * 25), rotate: (i % 2 ? -1 : 1) * 90, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } }));

  // marquee speeds up with scroll velocity
  const mq = gsap.to(".marquee-track", { xPercent: -50, repeat: -1, duration: 28, ease: "none" });
  ScrollTrigger.create({ onUpdate: s => { mq.timeScale(Math.min(6, 1 + Math.abs(s.getVelocity()) / 300)); } });
  gsap.ticker.add(() => { const t = mq.timeScale(); if (t > 1) mq.timeScale(Math.max(1, t - (t - 1) * .06)); });
  $(".marquee-track").style.animation = "none";

  // generic reveals
  $$("[data-reveal]").forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: el, start: "top 88%" } }));
  $$("[data-stagger]").forEach(g => gsap.from(g.children, { y: 60, opacity: 0, duration: .9, stagger: .09, ease: "power3.out", clearProps: "transform,opacity", scrollTrigger: { trigger: g, start: "top 85%" } }));
  $$(".split-text").forEach(h => gsap.from($$(".word>span", h), { yPercent: 115, rotate: 5, duration: 1.1, stagger: .07, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 85%" } }));

  // counters
  $$("[data-count]").forEach(b => {
    const o = { v: 0 };
    gsap.to(o, { v: +b.dataset.count, duration: 1.8, ease: "power2.out", onUpdate: () => b.textContent = fmt(o.v, b.dataset.suf), scrollTrigger: { trigger: b, start: "top 90%", once: true } });
  });

  // gantt bars

  // chat bubbles pop in one by one
  gsap.from("#iniChat .msg", { y: 20, scale: .9, opacity: 0, duration: .5, stagger: .5, ease: "back.out(1.6)", scrollTrigger: { trigger: "#iniChat", start: "top 70%" } });

  // spotlight on pillars + tilt on collab cards
  $$(".pillar").forEach(p => p.addEventListener("pointermove", e => {
    const r = p.getBoundingClientRect();
    p.style.setProperty("--mx", (e.clientX - r.left) / r.width * 100 + "%");
    p.style.setProperty("--my", (e.clientY - r.top) / r.height * 100 + "%");
  }));
  $$(".cg").forEach(c => {
    c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect();
      gsap.to(c, { rotateY: ((e.clientX - r.left) / r.width - .5) * 10, rotateX: -((e.clientY - r.top) / r.height - .5) * 10, transformPerspective: 800, duration: .4 });
    });
    c.addEventListener("pointerleave", () => gsap.to(c, { rotateX: 0, rotateY: 0, duration: .6 }));
  });

  // magnetic buttons
  $$(".magnetic").forEach(b => {
    b.addEventListener("pointermove", e => {
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .3, duration: .3 });
    });
    b.addEventListener("pointerleave", () => gsap.to(b, { x: 0, y: 0, duration: .6, ease: "elastic.out(1,.4)" }));
  });

  // nav scroll-spy: highlights the section that is under the upper part of the viewport
  const spyIds = ["timeline", "improve", "database", "initiative", "collab", "contact"];
  const spy = () => {
    const y = innerHeight * 0.4; let cur = null;
    spyIds.forEach(id => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= y) cur = id; });
    $$(".nav nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + cur));
  };
  addEventListener("scroll", spy, { passive: true });
  if (lenis) lenis.on("scroll", spy);
  setInterval(spy, 250);
  spy();

  /* ---------- THE TIMELINE: translucent dark stage + pinned horizontal scroll ---------- */
  gsap.to("#tlDim", { opacity: 1, ease: "none", scrollTrigger: { trigger: "#timeline", start: "top 95%", end: "top 20%", scrub: true } });
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const track = $("#tlTrack"), cols = $$(".tl-col");
    const dist = () => track.scrollWidth - innerWidth;
    let cur = -1;
    const setActive = i => {
      if (i === cur) return; cur = i;
      cols.forEach((c, k) => c.classList.toggle("on", k === i));
      $("#tlCur").textContent = String(i + 1).padStart(2, "0");
    };
    setActive(0);
    gsap.from(cols, { y: 100, opacity: 0, duration: 1, stagger: .05, clearProps: "transform,opacity", ease: "power3.out", scrollTrigger: { trigger: "#timeline", start: "top 70%" } });
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: {
        trigger: ".tl-pin", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true,
        onUpdate: self => {
          gsap.set("#tlFill", { scaleX: self.progress });
          setActive(Math.min(cols.length - 1, Math.max(0, Math.round(self.progress * (cols.length - 1)))));
        },
      },
    });
    return () => { cols.forEach(c => c.classList.remove("on")); };
  });
  mm.add("(max-width: 900px)", () => {
    $$(".tl-col").forEach(c => gsap.from(c, { y: 60, opacity: 0, duration: .8, clearProps: "transform,opacity", scrollTrigger: { trigger: c, start: "top 88%" } }));
  });

  addEventListener("load", () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); spy(); });
})();
