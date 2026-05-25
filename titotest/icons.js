/* ============================================================
   EarthKeeper · Iconos
   Helper para inyectar SVG monocromáticos donde haya un
   <i data-ek-icon="leaf"></i>. Estilo filled/solid, mint #74C69D.
   ============================================================ */
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICONS = {
    leaf:
      "M20.5 3.5c-7 .3-12 3.2-14.2 8C4.6 15 5 18.7 7.5 21l1.6-1.6c-.6-1.8-.5-3.6.4-5.3.6 2.1 1.9 3.7 3.9 4.6 4.5 1.9 8.6-1.4 8.6-8.3 0-2-.5-4.4-1.5-6.9zM10 16.5c1.1-3.4 3.3-5.8 6.5-7.2-2.2 2.7-3.7 5.1-4.5 7.3-.6.1-1.3.1-2-.1z",
    tree:
      "M12 2 6 9h2.5l-4 5H8v3h3v4h2v-4h3v-3h3.5l-4-5H18z",
    "map-pin":
      "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z",
    users:
      "M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-4.2 1-5.4 2.5C10.5 14.4 8.9 13.5 7 13.5c-3.3 0-6 2-6 4.5V20h12v-1.5c0-.8.2-1.5.5-2.1.9 1.5 2.6 2.6 4.5 2.6 3 0 5-1.8 5-4 0-1.7-2-2.5-6-2.5z",
    drop:
      "M12 2s-6 7-6 12a6 6 0 0 0 12 0c0-5-6-12-6-12z",
    certificate:
      "M4 4h16v12H14l-2 3-2-3H4z m4 3v2h8V7zm0 4v2h6v-2z",
    calendar:
      "M7 2v2H4v18h16V4h-3V2h-2v2H9V2zm-1 8h12v10H6zm2 2v2h3v-2zm5 0v2h3v-2z",
    gift:
      "M20 7h-3.2c.2-.4.2-.8.2-1.2A2.8 2.8 0 0 0 14.2 3c-.9 0-1.7.4-2.2 1-.5-.6-1.3-1-2.2-1A2.8 2.8 0 0 0 7 5.8c0 .4 0 .8.2 1.2H4v5h1v9h14v-9h1zm-6-2c.4 0 .8.4.8.8 0 .4-.4 1.2-1.6 1.2H12c0-1 .6-2 2-2zm-4 0c1.4 0 2 1 2 2h-1.2C9.6 7 9.2 6.2 9.2 5.8c0-.4.4-.8.8-.8zM6 9h5v2H6zm7 0h5v2h-5zM7 13h4v7H7zm6 0h4v7h-4z",
    check:
      "m9 16.2-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z",
    shield:
      "M12 2 4 5v7c0 5 3.5 9.5 8 10 4.5-.5 8-5 8-10V5z",
    camera:
      "M9 4 7 6H4v14h16V6h-3l-2-2zm3 4a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    play:
      "M8 5v14l11-7z",
    arrow:
      "M5 12h12.2l-4.6-4.6L14 6l7 7-7 7-1.4-1.4 4.6-4.6H5z",
    spark:
      "M12 2 13.5 9 21 10.5 13.5 12 12 19l-1.5-7L3 10.5 10.5 9z",
  };

  function buildIcon(pathData, size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", pathData);
    svg.appendChild(path);
    return svg;
  }

  function render() {
    document.querySelectorAll("[data-ek-icon]").forEach((el) => {
      const name = el.getAttribute("data-ek-icon");
      const size = Math.max(8, Math.min(64, parseInt(el.getAttribute("data-ek-size") || "20", 10) || 20));
      const pathData = ICONS[name];
      if (!pathData) return;
      el.replaceChildren(buildIcon(pathData, size));
      el.style.display = el.style.display || "inline-flex";
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
  window.EK_renderIcons = render;
})();
