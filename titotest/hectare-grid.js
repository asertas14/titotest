/* ============================================================
   EarthKeeper · Hectare grid renderer
   Renders a grid of N×M cells representing the cuenca; marks
   K cells as 'apadrinadas' (mint), 1 as 'tu próxima' (orange).
   Reads config from data-attrs on the host element.
   ============================================================ */
(function () {
  const SVG_NS = "http://www.w3.org/2000/svg";

  function clampNumber(value, fallback, min, max) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  function render(host) {
    const cols = clampNumber(parseInt(host.dataset.cols || "24", 10), 24, 1, 80);
    const rows = clampNumber(parseInt(host.dataset.rows || "14", 10), 14, 1, 80);
    const apadrinadas = clampNumber(parseInt(host.dataset.apadrinadas || "147", 10), 147, 0, cols * rows);
    const yourIdx = clampNumber(parseInt(host.dataset.yourIdx || "171", 10), 171, 0, cols * rows - 1);
    const size = clampNumber(parseFloat(host.dataset.cellSize || "12"), 12, 1, 40);
    const gap = clampNumber(parseFloat(host.dataset.gap || "3"), 3, 0, 20);
    const padding = clampNumber(parseFloat(host.dataset.padding || "4"), 4, 0, 40);

    const total = cols * rows;
    const width = padding * 2 + cols * size + (cols - 1) * gap;
    const height = padding * 2 + rows * size + (rows - 1) * gap;

    // Distribute the "apadrinadas" cells pseudo-randomly but deterministic
    // (clustered in the upper-left region to feel like territory expansion)
    const filled = new Set();
    // Seeded pseudo-random for consistency between renders
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    // Fill: take first N where N=apadrinadas; bias to top-left
    const indices = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        // weight: top-left more likely
        const weight = (1 - r / rows) * 0.6 + (1 - c / cols) * 0.4 + rand() * 0.3;
        indices.push({ i, w: weight });
      }
    }
    indices.sort((a, b) => b.w - a.w);
    for (let k = 0; k < Math.min(apadrinadas, total); k++) {
      filled.add(indices[k].i);
    }
    filled.delete(yourIdx); // Make sure your hectare is shown as orange

    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      const x = padding + (i % cols) * (size + gap);
      const y = padding + Math.floor(i / cols) * (size + gap);
      let cls = "hg-empty";
      if (i === yourIdx) cls = "hg-orange";
      else if (filled.has(i)) cls = "hg-mint";
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", x);
      rect.setAttribute("y", y);
      rect.setAttribute("width", size);
      rect.setAttribute("height", size);
      rect.setAttribute("rx", "2");
      rect.setAttribute("class", cls);
      frag.appendChild(rect);
    }
    host.setAttribute("viewBox", `0 0 ${width} ${height}`);
    host.setAttribute("preserveAspectRatio", "xMidYMid meet");
    host.replaceChildren(frag);
  }

  function init() {
    document.querySelectorAll("[data-ek-hectare-grid]").forEach(render);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
