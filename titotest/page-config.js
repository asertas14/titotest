/* ============================================================
   EarthKeeper · Page-level UI wiring
   Keeps per-page DOM setup out of inline scripts so CSP can
   block inline JavaScript.
   ============================================================ */
(function () {
  function setText(id, text) {
    const node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function updatePrices() {
    const variant = document.documentElement.getAttribute("data-ek-variant");
    const prices = window.EK_CONFIG && window.EK_CONFIG.precios;
    const p = prices && prices[variant];
    if (!p) return;

    if (variant === "adopta") {
      if (p.labelLargo) {
        setText("cta-price", p.labelLargo);
        setText("sum-price", p.labelLargo);
      }
      if (p.label) setText("btn-price", "— " + p.label);
    }

    if (variant === "salva") {
      if (p.label) {
        setText("cta-price", p.label);
        setText("sum-price", p.label + " · 12 meses");
        setText("btn-price", "— " + p.label);
      }
    }

    if (p.label) setText("sticky-amount", p.label.replace(/\s*COP\s*/i, "").trim());
  }

  function wireGiftChoice() {
    const radios = document.querySelectorAll('input[name="modo_regalo_choice"]');
    if (!radios.length) return;

    const hidden = document.querySelector('input[name="modo_regalo"]');
    const fields = document.querySelector("[data-ek-gift-fields]");
    const sumMode = document.querySelector("[data-ek-sum-mode]");
    let tracked = false;

    function update() {
      const selected = document.querySelector('input[name="modo_regalo_choice"]:checked');
      const on = selected && selected.value === "gift";
      if (hidden) hidden.value = on ? "on" : "";
      if (fields) fields.hidden = !on;
      if (sumMode) sumMode.textContent = on ? "Regalo a un tercero" : "Para ti";
      if (on && !tracked && window.EK_track) {
        tracked = true;
        window.EK_track("GiftToggleOn", { variant: "salva" });
      }
    }

    radios.forEach((radio) => radio.addEventListener("change", update));
    update();
  }

  function boot() {
    updatePrices();
    wireGiftChoice();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
