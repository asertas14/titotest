/* ============================================================
   EarthKeeper · Configuración central
   Single source of truth para precios, webhook y pixel IDs.
   Mapea 1:1 a `lib/config.ts` en el proyecto Next.js.
   ============================================================ */

window.EK_CONFIG = {
  // ---- Ofertas (variables únicas <<PRECIO_L1>> / <<PRECIO_L2>>) ----
  precios: {
    adopta: {
      monto: 29000,
      moneda: "COP",
      cadencia: "/mes",
      label: "$29.000 COP",
      labelLargo: "$29.000 COP / mes",
      aprox: "≈ USD $7",
    },
    salva: {
      monto: 149000,
      moneda: "COP",
      cadencia: "único",
      label: "$149.000 COP",
      labelLargo: "$149.000 COP · pago único",
      aprox: "≈ USD $36",
    },
  },

  // ---- Webhook fake-door (Google Sheets / Mailerlite / Apps Script) ----
  // En Next.js: process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL
  webhook: {
    url: "https://script.google.com/macros/s/REEMPLAZAR_DEPLOY_ID/exec",
    timeoutMs: 6000,
  },

  // ---- Meta Pixel ----
  // En Next.js: process.env.NEXT_PUBLIC_META_PIXEL_ID
  metaPixel: {
    id: "REEMPLAZAR_PIXEL_ID",
    activo: false, // poner true en prod para inyectar el snippet real
  },

  // ---- GA4 / Plausible ----
  ga4: {
    measurementId: "G-REEMPLAZAR",
    activo: false,
  },
  plausible: {
    domain: "earthkeeper.co",
    activo: false,
  },

  // ---- UTM keys que propagamos al webhook ----
  utmKeys: ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"],
};
