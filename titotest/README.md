# EarthKeeper · POC landings (`/adopta` + `/salva`)

Prototipo HTML estático listo para portar a **Next.js 14 (App Router) + Tailwind + Vercel**.
Mide intención de pago (clicks a "Pagar ahora") con $500 USD en Meta Ads durante 2 semanas.

---

## Archivos en este repo

| Archivo | Rol |
|---|---|
| `index.html` | Selector dev/QA entre las dos landings (no entra a prod) |
| `adopta.html` | Landing /adopta · suscripción mensual |
| `salva.html`  | Landing /salva  · pago único anual + modo regalo |
| `shared.css`  | Sistema de diseño compartido (tokens + componentes) |
| `config.js`   | **Single source of truth**: precios, webhook URL, pixel IDs |
| `analytics.js`| Meta Pixel + GA4 + Plausible + UTM capture + fake-door handler |
| `icons.js`    | Inyector de SVG monocromáticos mint (`<i data-ek-icon="leaf">`) |

---

## Variables que vas a tocar

Todo está en `config.js` (en Next.js: `lib/config.ts` + `.env.local`):

```js
precios.adopta.monto        // <<PRECIO_L1>> — 29000 COP/mes
precios.salva.monto         // <<PRECIO_L2>> — 149000 COP único
webhook.url                 // → process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL
metaPixel.id  + .activo     // → process.env.NEXT_PUBLIC_META_PIXEL_ID
ga4.measurementId + .activo // → process.env.NEXT_PUBLIC_GA4_ID
plausible.domain + .activo  // → process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
```

Cambiar los precios en un solo lugar actualiza hero, CTA, botón submit y form en
las dos páginas (los `<span id="hero-price">`, etc. se rellenan al cargar).

---

## Instrumentación (idéntica en ambas landings)

Eventos disparados por `analytics.js`:

| Evento | Cuándo |
|---|---|
| `PageView` | DOMContentLoaded |
| `ViewContent` | DOMContentLoaded (incluye `value` y `currency`) |
| `InitiateCheckout` | Form CTA entra al viewport (85%) **o** click en CTA del hero |
| `AddPaymentInfo` | Click en "Pagar ahora" (la conversión clave) |
| `GiftToggleOn` | Solo /salva — usuario activa el modo regalo |

Cada evento se mandó a las 3 plataformas activas (Meta + GA4 + Plausible) con los
UTMs capturados de la URL anexados. Los UTMs se persisten en `sessionStorage` así
que sobreviven la navegación interna.

---

## Fake-door submit

Al hacer click en "Pagar ahora":

1. Se dispara `AddPaymentInfo` en las 3 plataformas.
2. Se hace `fetch` no-cors al webhook (Google Apps Script / Mailerlite) con:
   `{ variant, nombre, email, modo_regalo, destinatario, mensaje, precio, currency, ts, page, ...utms }`
3. Se reemplaza el form por el estado de gracias:
   *"¡Gracias [nombre]! Estamos terminando de habilitar pagos, te escribimos en 48h"*
4. **Nunca** se cobra. Es fake-door honesto durante la prueba.

---

## Migración a Next.js (orden sugerido)

```
app/
  layout.tsx          → header + footer compartidos
  adopta/page.tsx     → adopta.html convertido a JSX
  salva/page.tsx      → salva.html  convertido a JSX
  api/lead/route.ts   → opcional: proxy al webhook si necesitas server-side
components/
  Hero.tsx, Steps.tsx, Family.tsx, FormCTA.tsx, GiftToggle.tsx
lib/
  config.ts           → port de config.js
  analytics.ts        → port de analytics.js (usar useEffect en un client component)
public/
  fotos/              → fotos reales del territorio (next/image)
```

**Imágenes:** los `<div class="ek-img-ph">` son placeholders rayados con la
descripción exacta de la foto que va ahí. Cambiarlos por `<Image>` de Next con
las fotos del territorio cuando estén listas (todas las descripciones especifican
ratio y resolución sugerida).

**Tailwind:** los tokens en `:root` de `shared.css` mapean directo a
`tailwind.config.ts → theme.extend.colors.ek.*`. Las clases `ek-*` son CSS plano
para evitar bloquear el preview; al portar, traducirlas a utilities de Tailwind
o dejarlas como `@layer components`.

**Fuente Calibri:** no es web font legal, así que cargué Inter como fallback web
(que está pedido en el brief). Calibri queda solo para el "design intent" de
documentos internos.

---

## Deploy a Vercel

1. `npx create-next-app@latest earthkeeper-landings --ts --app --tailwind`
2. Portar los archivos según la tabla de arriba.
3. En Vercel → Project → Settings → Environment Variables:
   - `NEXT_PUBLIC_META_PIXEL_ID`
   - `NEXT_PUBLIC_LEAD_WEBHOOK_URL`
   - `NEXT_PUBLIC_GA4_ID` (opcional)
4. En `lib/config.ts` poner `activo: true` para Meta Pixel.
5. Verificar eventos en Meta Events Manager → Test Events antes de lanzar la campaña.

---

## Revisión OWASP / seguridad

Este prototipo es HTML/CSS/JS estático, así que la superficie principal está en
XSS, captura de datos del formulario, terceros cargados en cliente y cabeceras
HTTP del hosting.

Hardening incluido:

- `vercel.json` define CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options` y `Permissions-Policy`.
- No hay scripts inline: la configuración por página vive en `page-config.js`.
- Los SVG y el mapa de hectáreas se crean con APIs DOM, no con `innerHTML`.
- Los campos de formulario y UTMs tienen límites de longitud antes de enviarse
  al webhook.
- El webhook solo se invoca si la URL configurada es HTTPS y no es placeholder.

Notas para producción:

- Estas cabeceras aplican en Vercel. GitHub Pages puro no permite configurar
  headers; si se usa GitHub Pages, poner Cloudflare/Netlify/Vercel delante.
- El webhook público debe validar origen, tamaño, rate limit y campos recibidos
  del lado servidor. El navegador nunca es una frontera de confianza.
- No poner secretos en `config.js`; los IDs públicos de analytics sí pueden ir
  en cliente, pero tokens/API keys privadas no.

---

## Checklist pre-launch

- [ ] Fotos reales del territorio reemplazan los placeholders
- [ ] Pixel ID real en `config.js` y `activo: true`
- [ ] Webhook URL apunta a Google Sheets / Mailerlite de producción
- [ ] Meta Events Manager confirma los 4 eventos (PageView, ViewContent, InitiateCheckout, AddPaymentInfo)
- [ ] UTM tracking probado con una URL como `?utm_source=meta&utm_campaign=adopta_v1`
- [ ] Form en mobile (375px) testeado en iPhone real
- [ ] Texto del estado fake-door revisado por legal (es honesto, pero queda registro)
