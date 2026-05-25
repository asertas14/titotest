/* ============================================================
   EarthKeeper · Analytics + fake-door form handler
   - Meta Pixel: PageView, ViewContent, InitiateCheckout, AddPaymentInfo
   - GA4 / Plausible mirror
   - UTM capture + propagación al webhook
   ============================================================ */
(function () {
  const cfg = window.EK_CONFIG || {};
  const log = (...args) => console.info("[EK]", ...args);
  const FIELD_LIMITS = {
    nombre: 120,
    email: 254,
    destinatario: 120,
    mensaje: 500,
    utm: 160,
  };

  function truncate(value, max) {
    return value.toString().trim().slice(0, max);
  }

  // ----------------------------------------------------------
  // UTM capture (persist in sessionStorage so it survives nav)
  // ----------------------------------------------------------
  function captureUtms() {
    const params = new URLSearchParams(location.search);
    let stored = {};
    try {
      stored = JSON.parse(sessionStorage.getItem("ek_utms") || "{}");
    } catch (err) {
      sessionStorage.removeItem("ek_utms");
    }
    const utms = { ...stored };
    (cfg.utmKeys || []).forEach((k) => {
      if (!/^utm_[a-z0-9_]+$/i.test(k)) return;
      const v = params.get(k);
      if (v) utms[k] = truncate(v, FIELD_LIMITS.utm);
    });
    sessionStorage.setItem("ek_utms", JSON.stringify(utms));
    return utms;
  }
  const UTMS = captureUtms();

  // ----------------------------------------------------------
  // Meta Pixel — inject standard snippet only if activo=true
  // ----------------------------------------------------------
  if (cfg.metaPixel && cfg.metaPixel.activo && cfg.metaPixel.id) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", cfg.metaPixel.id);
  }

  // GA4 (gtag) — inject only if activo
  if (cfg.ga4 && cfg.ga4.activo && cfg.ga4.measurementId) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + cfg.ga4.measurementId;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag("js", new Date());
    gtag("config", cfg.ga4.measurementId, { send_page_view: false });
  }

  // Plausible
  if (cfg.plausible && cfg.plausible.activo && cfg.plausible.domain) {
    const s = document.createElement("script");
    s.defer = true;
    s.dataset.domain = cfg.plausible.domain;
    s.src = "https://plausible.io/js/script.js";
    document.head.appendChild(s);
  }

  // ----------------------------------------------------------
  // Unified track() — fires Meta + GA4 + Plausible + console
  // ----------------------------------------------------------
  function track(event, params) {
    const payload = { ...(params || {}), ...UTMS };
    log("event:", event, payload);

    // Meta Pixel — map our event names to FB standard events
    if (window.fbq) {
      try { fbq("track", event, payload); } catch (e) { log("fbq error", e); }
    }
    // GA4
    if (window.gtag) {
      try { gtag("event", event, payload); } catch (e) { log("gtag error", e); }
    }
    // Plausible
    if (window.plausible) {
      try { window.plausible(event, { props: payload }); } catch (e) {}
    }
  }
  window.EK_track = track;

  // ----------------------------------------------------------
  // Page-level events
  // ----------------------------------------------------------
  const variant = document.documentElement.getAttribute("data-ek-variant") || "unknown";
  document.addEventListener("DOMContentLoaded", () => {
    track("PageView", { variant });
    track("ViewContent", {
      variant,
      content_name: variant === "adopta"
        ? "Adopta una hectárea (mensual)"
        : "Salva una hectárea (anual)",
      content_category: "donation_landing",
      value: variant === "adopta" ? 29000 : 149000,
      currency: "COP",
    });
  });

  // ----------------------------------------------------------
  // InitiateCheckout when CTA form section enters viewport
  // ----------------------------------------------------------
  let initiateCheckoutFired = false;
  function maybeFireInitiateCheckout() {
    if (initiateCheckoutFired) return;
    const form = document.querySelector("[data-ek-cta-section]");
    if (!form) return;
    const rect = form.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      initiateCheckoutFired = true;
      track("InitiateCheckout", { variant });
      window.removeEventListener("scroll", maybeFireInitiateCheckout);
    }
  }
  window.addEventListener("scroll", maybeFireInitiateCheckout, { passive: true });
  document.addEventListener("DOMContentLoaded", maybeFireInitiateCheckout);

  // Also fire if user clicks any hero CTA that anchors to #form
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href="#form"], [data-ek-scroll-form]');
    if (!a) return;
    if (!initiateCheckoutFired) {
      initiateCheckoutFired = true;
      track("InitiateCheckout", { variant, source: "hero_cta" });
    }
  });

  // ----------------------------------------------------------
  // Fake-door form submit
  // ----------------------------------------------------------
  document.addEventListener("submit", async (e) => {
    const form = e.target.closest("[data-ek-form]");
    if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const fd = new FormData(form);
    const data = {
      variant,
      nombre: truncate(fd.get("nombre") || "", FIELD_LIMITS.nombre),
      email: truncate(fd.get("email") || "", FIELD_LIMITS.email),
      modo_regalo: fd.get("modo_regalo") === "on",
      destinatario: truncate(fd.get("destinatario") || "", FIELD_LIMITS.destinatario),
      mensaje: truncate(fd.get("mensaje") || "", FIELD_LIMITS.mensaje),
      precio: variant === "adopta" ? 29000 : 149000,
      currency: "COP",
      ts: new Date().toISOString(),
      page: location.pathname,
      ...UTMS,
    };

    // 1. Fire AddPaymentInfo (the key conversion event)
    track("AddPaymentInfo", {
      variant,
      value: data.precio,
      currency: "COP",
      gift: data.modo_regalo,
    });

    // 2. Disable submit + show thanks IMMEDIATELY (don't wait for webhook)
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Procesando...";
    }

    // 3. Fire-and-forget webhook
    const url = cfg.webhook && cfg.webhook.url;
    const isHttpsWebhook = (() => {
      try {
        return new URL(url).protocol === "https:";
      } catch (err) {
        return false;
      }
    })();
    if (url && isHttpsWebhook && !/REEMPLAZAR/.test(url)) {
      try {
        await fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data),
        });
      } catch (err) {
        log("webhook error", err);
      }
    } else {
      log("webhook stub — payload:", data);
    }

    // 4. Swap to thank-you state
    const wrapper = form.closest("[data-ek-form-wrap]");
    const thanks = wrapper && wrapper.querySelector("[data-ek-thanks]");
    if (thanks) {
      form.style.display = "none";
      thanks.classList.add("is-shown");
      const slot = thanks.querySelector("[data-ek-thanks-name]");
      if (slot) slot.textContent = data.nombre || "amigo del bosque";
    }
  });

  // ----------------------------------------------------------
  // Gift toggle (only in /salva)
  // ----------------------------------------------------------
  document.addEventListener("click", (e) => {
    const sw = e.target.closest("[data-ek-gift-toggle]");
    if (!sw) return;
    const on = sw.getAttribute("aria-checked") !== "true";
    sw.setAttribute("aria-checked", String(on));
    const hidden = document.querySelector('input[name="modo_regalo"]');
    if (hidden) hidden.value = on ? "on" : "";
    const fields = document.querySelector("[data-ek-gift-fields]");
    if (fields) fields.hidden = !on;
    if (on) track("GiftToggleOn", { variant });
  });

  // Sub-CTA "Regalar a alguien" → activa el toggle / radio + scroll
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-ek-gift-cta]");
    if (!a) return;
    e.preventDefault();
    const sw = document.querySelector("[data-ek-gift-toggle]");
    if (sw && sw.getAttribute("aria-checked") !== "true") sw.click();
    const radio = document.querySelector('input[name="modo_regalo_choice"][value="gift"]');
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const target = document.querySelector("#form");
    if (target) {
      const y = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  });
})();
