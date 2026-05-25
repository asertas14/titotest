/* ============================================================
   EarthKeeper · Motion
   - IntersectionObserver fade-up entrance for [data-anim]
   - Scroll-locked header state (.is-scrolled)
   - Animated stat counters (data-count)
   - is-loaded class for hero entrance
   ============================================================ */
(function () {
  const reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 1. Hero entrance (immediate) ----
  function flagLoaded() {
    document.documentElement.classList.add("is-loaded");
  }
  if (document.readyState === "complete" || document.readyState === "interactive") {
    requestAnimationFrame(() => requestAnimationFrame(flagLoaded));
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      requestAnimationFrame(() => requestAnimationFrame(flagLoaded));
    });
  }

  // ---- 2. IntersectionObserver for [data-anim] ----
  function initAnims() {
    const els = document.querySelectorAll("[data-anim]");
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    // If the document is hidden at boot (preview iframes, prerender, hidden tab),
    // IO callbacks don't fire. Force-reveal so screenshots and SSR-like contexts
    // always show content.
    if (document.hidden) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));

    // Safety net: after 2s, force-reveal anything still hidden that is
    // geometrically in the viewport (handles edge cases where IO is lazy).
    setTimeout(() => {
      els.forEach((el) => {
        if (el.classList.contains("is-in")) return;
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }, 2000);
  }

  // ---- 3. Stat counters (data-count) ----
  function animateCount(el) {
    const target = parseFloat(el.getAttribute("data-count"));
    const suffix = el.getAttribute("data-count-suffix") || "";
    const prefix = el.getAttribute("data-count-prefix") || "";
    const decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
    const dur = parseInt(el.getAttribute("data-count-duration") || "1400", 10);
    if (isNaN(target)) return;
    if (reduced) {
      el.textContent = prefix + target.toLocaleString("es-CO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      return;
    }
    const start = performance.now();
    el.classList.add("is-counting");
    function frame(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = target * eased;
      el.textContent =
        prefix +
        value.toLocaleString("es-CO", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) +
        suffix;
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        el.classList.remove("is-counting");
      }
    }
    requestAnimationFrame(frame);
  }

  function initCounters() {
    const nums = document.querySelectorAll("[data-count]");
    if (!("IntersectionObserver" in window) || document.hidden) {
      nums.forEach(animateCount);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((el) => io.observe(el));
  }

  // ---- 4. Scrolled header ----
  function initHeaderScroll() {
    const header = document.querySelector(".ek-header");
    if (!header) return;
    let raf = 0;
    function update() {
      const scrolled = window.scrollY > 60;
      header.classList.toggle("is-scrolled", scrolled);
      raf = 0;
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- 5. Smooth anchor scroll (account for fixed header) ----
  function initSmoothAnchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    });
  }

  // ---- 6. Sticky mobile CTA bar ----
  function initStickyBar() {
    const bar = document.querySelector("#stickybar");
    if (!bar) return;
    const hero = document.querySelector(".ek-hero");
    const form = document.querySelector("#form");
    document.body.classList.add("has-stickybar");

    function update() {
      const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      const formTop = form ? form.getBoundingClientRect().top : Infinity;
      const show = heroBottom < 0 && formTop > window.innerHeight * 0.5;
      bar.classList.toggle("is-shown", show);
      bar.setAttribute("aria-hidden", String(!show));
    }
    let raf = 0;
    window.addEventListener(
      "scroll",
      () => {
        if (!raf) raf = requestAnimationFrame(() => { update(); raf = 0; });
      },
      { passive: true }
    );
    update();
  }

  // ---- 7. Scroll progress bar (in header) ----
  function initScrollProgress() {
    const bar = document.querySelector("[data-ek-progress]");
    if (!bar) return;
    let raf = 0;
    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.transform = `scaleX(${pct / 100})`;
      raf = 0;
    }
    window.addEventListener(
      "scroll",
      () => { if (!raf) raf = requestAnimationFrame(update); },
      { passive: true }
    );
    update();
  }

  // ---- 8. Magnetic hover for primary CTAs ----
  function initMagneticButtons() {
    if (reduced) return;
    // Touch devices: skip
    if (matchMedia("(hover: none)").matches) return;
    const targets = document.querySelectorAll("[data-ek-magnet]");
    targets.forEach((el) => {
      const strength = parseFloat(el.getAttribute("data-ek-magnet")) || 0.32;
      let raf = 0;
      function move(e) {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
        });
      }
      function reset() {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      }
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", reset);
    });
  }

  // ---- 9. Tilt on step cards ----
  function initTiltCards() {
    if (reduced || matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-ek-tilt]").forEach((el) => {
      let raf = 0;
      function move(e) {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `perspective(900px) rotateX(${-ny * 4}deg) rotateY(${nx * 6}deg) translateY(-4px)`;
        });
      }
      function reset() {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      }
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", reset);
    });
  }

  // ---- 10. Live ticker increment in social proof ----
  function initLiveTicker() {
    if (reduced) return;
    const el = document.querySelector("[data-ek-live]");
    if (!el) return;
    let n = parseInt(el.textContent, 10);
    if (isNaN(n)) return;
    setInterval(() => {
      if (Math.random() > 0.7) {
        n += 1;
        el.textContent = n.toLocaleString("es-CO");
        el.animate(
          [
            { color: "#74C69D", transform: "scale(1.08)" },
            { color: "", transform: "scale(1)" },
          ],
          { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      }
    }, 8000);
  }

  // ---- 11. Wizard 3-step form ----
  function initWizard() {
    const wiz = document.querySelector("[data-ek-wizard]");
    if (!wiz) return;
    const panes = wiz.querySelectorAll(".ek-wizard__pane");
    const pills = wiz.querySelectorAll(".ek-wizard__step-pill");
    let current = 1;
    let initiateFired = false;

    const variant = document.documentElement.getAttribute("data-ek-variant") || "unknown";

    function go(to) {
      if (to < 1 || to > panes.length) return;
      panes.forEach((p) => {
        p.classList.toggle("is-active", parseInt(p.dataset.step, 10) === to);
      });
      pills.forEach((pill, i) => {
        const n = i + 1;
        pill.classList.toggle("is-active", n === to);
        pill.classList.toggle("is-done", n < to);
      });
      current = to;
      // Scroll the form back into view so the user can see the new step
      const wrap = wiz.closest("[data-ek-cta-section]");
      if (wrap) {
        const y = wrap.getBoundingClientRect().top + window.scrollY - 80;
        if (window.scrollY > y + 100 || window.scrollY < y - 200) {
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
      // Fire InitiateCheckout on the first "Continuar" press
      if (to === 2 && !initiateFired && window.EK_track) {
        initiateFired = true;
        window.EK_track("InitiateCheckout", { variant, source: "wizard_step1" });
      }
      // On step 3, refresh summary
      if (to === 3) refreshSummary();
    }

    function refreshSummary() {
      const name = (wiz.querySelector('[name="nombre"]')?.value || "—").trim();
      const email = (wiz.querySelector('[name="email"]')?.value || "—").trim();
      const choice = wiz.querySelector('input[name="hectare_choice"]:checked')?.value;
      const labels = {
        proxima: "CRC-148 · La Esmeralda",
        elegir: "A elegir por el padrino",
        sorpresa: "Asignación sorpresa",
      };
      const sumName = wiz.querySelector("[data-ek-sum-name]");
      const sumEmail = wiz.querySelector("[data-ek-sum-email]");
      const sumHectare = wiz.querySelector("[data-ek-sum-hectare]");
      if (sumName) sumName.textContent = name || "—";
      if (sumEmail) sumEmail.textContent = email || "—";
      if (sumHectare && choice) sumHectare.textContent = labels[choice] || "—";
    }

    wiz.addEventListener("click", (e) => {
      const next = e.target.closest("[data-ek-step-next]");
      const back = e.target.closest("[data-ek-step-back]");
      if (next) {
        // Validate step 2 fields before advancing
        if (current === 2) {
          const nombre = wiz.querySelector('[name="nombre"]');
          const email = wiz.querySelector('[name="email"]');
          if (!nombre.value.trim() || !email.value.trim() || !/.+@.+\..+/.test(email.value)) {
            [nombre, email].forEach((f) => {
              if (!f.value.trim()) f.focus();
            });
            wiz.querySelectorAll(".ek-field input:invalid").forEach((f) => f.reportValidity());
            return;
          }
        }
        go(current + 1);
      }
      if (back) {
        go(current - 1);
      }
    });
  }

  // ---- Boot ----
  function boot() {
    initAnims();
    initCounters();
    initHeaderScroll();
    initSmoothAnchors();
    initStickyBar();
    initScrollProgress();
    initMagneticButtons();
    initTiltCards();
    initLiveTicker();
    initWizard();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // When the iframe/tab becomes visible after boot, re-evaluate any animations
  // that didn't get a chance to fire while hidden.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      document.querySelectorAll("[data-anim]:not(.is-in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          el.classList.add("is-in");
        }
      });
    }
  });
})();
