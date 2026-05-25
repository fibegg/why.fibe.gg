#!/usr/bin/env node
// Generate per-locale static HTML files from template.html + assets/i18n.json.
//
//   template.html             ← source of truth (HTML structure only,
//                                text-less [data-i18n] elements)
//   assets/i18n.json          ← source of truth (text strings, every locale)
//   ───────────────────────────────────────────────────────────────
//   index.html                ← generated (default locale, root)
//   <locale>/index.html       ← generated (every other locale)
//
// Run after editing template.html or assets/i18n.json:
//   $ npm run build:locales
//
// Each non-default locale becomes a sibling folder (e.g. /uk/, /de/).
// The default locale (en) ends up at /index.html.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "node-html-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_PATH = path.join(ROOT, "template.html");
const I18N_PATH = path.join(ROOT, "assets/i18n.json");

const DEFAULT_LOCALE = "en";
const SITE_ORIGIN = "https://why.fibe.gg";

// --------------------------------------------------------------------------
const lookup = (dict, dottedKey) => {
  const parts = dottedKey.split(".");
  let cur = dict;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
};

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// ── Hero graph generator ──────────────────────────────────────────────────
// Produces the INSIDE of the SVG (defs, faded alts, Fibe Way + waypoints,
// endpoints, labels). The number of intermediate waypoints comes from
// hero.graph.steps[] in i18n.json. Three of the six decorative paths are
// dead-ends (don't reach SHIP) — visually emphasising "many paths, one
// actually finishes."
const renderHeroGraphSvg = (graph) => {
  const startLabel = graph?.start_label || "YOU";
  const endLabel = graph?.end_label || "SHIP";
  const wayLabel = graph?.way_label || "Fibe Way";
  const aria = graph?.aria || "";
  const steps = Array.isArray(graph?.steps) ? graph.steps : [];

  // Geometry: viewBox is 720 x 220, endpoints fixed at the same y so the
  // Fibe Way reads as a clean horizontal "shortcut".
  const START_X = 60;
  const END_X = 660;
  const MID_Y = 110;
  const SPAN = END_X - START_X;

  const n = Math.max(1, steps.length);
  const waypoints = steps.map((label, i) => ({
    x: Math.round(START_X + (SPAN * (i + 1)) / (n + 1)),
    y: MID_Y,
    label,
  }));

  const fibeWayD =
    "M " +
    [
      `${START_X} ${MID_Y}`,
      ...waypoints.map((w) => `${w.x} ${w.y}`),
      `${END_X} ${MID_Y}`,
    ].join(" L ");

  // Decorative alternative paths — mix of dead-ends and reaches-SHIP, so
  // visually "many paths, only the Fibe Way actually finishes".
  const altPaths = [
    // Dead-ends — terminate mid-graph.
    "M 60 110 L 200 50 L 360 60 L 460 55",
    "M 60 110 L 180 170 L 320 180",
    "M 60 110 L 220 90 L 320 180 L 460 60",
    // Through-paths — reach SHIP.
    "M 60 110 L 220 90 L 360 60 L 480 150 L 660 110",
    "M 60 110 L 180 170 L 360 60 L 480 150 L 660 110",
    "M 60 110 L 220 90 L 320 180 L 520 90 L 660 110",
  ];

  const decorDots = [
    [180, 170], [200, 50], [320, 180], [460, 60], [480, 150], [520, 90],
    [460, 55], [280, 180], [420, 70],
  ];

  return `
    <title>${esc(aria || wayLabel)}</title>
    <defs>
      <!-- gradientUnits=userSpaceOnUse so the gradient anchors to SVG
           coordinates, not the path's bounding box. With all waypoints on
           the same horizontal line the bounding box has zero height, and
           the default objectBoundingBox mode wouldn't render the gradient
           — leaving the stroke invisible. -->
      <linearGradient id="hero-graph-shortest"
                      x1="${START_X}" y1="${MID_Y}"
                      x2="${END_X}" y2="${MID_Y}"
                      gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#c3b0fc" stop-opacity="0.9" />
        <stop offset="100%" stop-color="#7c5ef3" stop-opacity="0.9" />
      </linearGradient>
      <!-- filterUnits=userSpaceOnUse for the same reason as the gradient:
           the Fibe Way path is perfectly horizontal so its bounding box
           collapses to zero height; objectBoundingBox-relative coords on
           the filter region would also collapse and the glow wouldn't
           render. Fixed-viewBox coords keep the blur intact. -->
      <filter id="hero-graph-glow"
              x="0" y="0" width="720" height="220"
              filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- Faded alternative paths — 3 dead-ends + 3 through-paths -->
    <g stroke="rgba(167,139,250,0.18)" stroke-width="1.4" fill="none" stroke-linecap="round">
      ${altPaths.map((d) => `<path d="${d}" />`).join("\n      ")}
    </g>

    <!-- The Fibe Way — the only path that's *the shortest* and goes the distance -->
    <g class="hero__graph-shortest" tabindex="0" role="button" aria-label="${esc(wayLabel)}">
      <title>${esc(wayLabel)}</title>
      <path class="hero__graph-shortest-line" d="${fibeWayD}"
            stroke="url(#hero-graph-shortest)" stroke-width="3.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"
            filter="url(#hero-graph-glow)" />
      <path class="hero__graph-shortest-hit" d="${fibeWayD}"
            stroke="transparent" stroke-width="22" fill="none"
            stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Decorative dots scattered on the alt paths -->
    <g fill="rgba(167,139,250,0.35)">
      ${decorDots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" />`).join("\n      ")}
    </g>

    <!-- Each Fibe-Way waypoint is its own hoverable group with an i18n label -->
    ${waypoints
      .map(
        (w, i) => `<g class="hero__graph-step" tabindex="0" role="button"
       data-step-label="${esc(w.label)}" aria-label="${esc(w.label)}">
      <title>${esc(w.label)}</title>
      <circle cx="${w.x}" cy="${w.y}" r="6" fill="#c3b0fc" class="hero__graph-step-dot" />
      <circle cx="${w.x}" cy="${w.y}" r="14" fill="transparent" class="hero__graph-step-hit" />
    </g>`
      )
      .join("\n    ")}

    <!-- Source endpoint (YOU) -->
    <g>
      <circle cx="${START_X}" cy="${MID_Y}" r="14" fill="#0f0f14" stroke="#c3b0fc" stroke-width="2.5" />
      <circle cx="${START_X}" cy="${MID_Y}" r="5" fill="#c3b0fc" />
    </g>

    <!-- Target endpoint (SHIP) -->
    <g>
      <circle cx="${END_X}" cy="${MID_Y}" r="14" fill="#0f0f14" stroke="#7c5ef3" stroke-width="2.5" />
      <circle cx="${END_X}" cy="${MID_Y}" r="5" fill="#7c5ef3" />
    </g>

    <text x="${START_X}" y="148" text-anchor="middle"
      fill="#c5c9d4" font-size="11" font-family="ui-monospace, Menlo, monospace"
      letter-spacing="0.12em">${esc(startLabel)}</text>
    <text x="${END_X}" y="148" text-anchor="middle"
      fill="#c5c9d4" font-size="11" font-family="ui-monospace, Menlo, monospace"
      letter-spacing="0.12em">${esc(endLabel)}</text>
  `;
};

const i18n = JSON.parse(fs.readFileSync(I18N_PATH, "utf8"));
const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

const locales = Object.keys(i18n);
if (!locales.includes(DEFAULT_LOCALE)) {
  console.error(`✗ i18n.json missing required default locale "${DEFAULT_LOCALE}".`);
  process.exit(1);
}

const missingByLocale = {}; // locale -> [missing keys]

for (const locale of locales) {
  const dict = i18n[locale];
  if (!dict) continue;
  missingByLocale[locale] = [];

  const root = parse(template, {
    comment: true,
    blockTextElements: { script: true, style: true },
  });

  // 1. Fill every [data-i18n] element with its translation.
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const v = lookup(dict, key);
    if (typeof v === "string") {
      el.set_content(v);
    } else {
      missingByLocale[locale].push(key);
    }
  });

  // 1a. Hero graph — render the SVG inner content from hero.graph data.
  //     The number of intermediate waypoints is steps.length; each one is
  //     a hoverable hit target whose label is from i18n.json.
  const heroSvg = root.querySelector("svg[data-hero-graph]");
  if (heroSvg) {
    const graphData = lookup(dict, "hero.graph") || {};
    heroSvg.set_content(renderHeroGraphSvg(graphData));
    if (graphData.aria) heroSvg.setAttribute("aria-label", graphData.aria);
  }

  // 2. Fill [data-i18n-attr] targets ("attr=key;attr2=key2").
  root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const spec = el.getAttribute("data-i18n-attr");
    spec.split(";").forEach((pair) => {
      const eq = pair.indexOf("=");
      if (eq === -1) return;
      const attr = pair.slice(0, eq).trim();
      const key = pair.slice(eq + 1).trim();
      const v = lookup(dict, key);
      if (typeof v === "string") {
        el.setAttribute(attr, v);
      } else {
        missingByLocale[locale].push(`${key} (→ ${attr})`);
      }
    });
  });

  // 3. <html lang="..."> + data-locale.
  const htmlEl = root.querySelector("html");
  if (htmlEl) {
    htmlEl.setAttribute("lang", locale);
    htmlEl.setAttribute("data-locale", locale);
  }

  // 4. <link rel="canonical"> per locale.
  const canonical = root.querySelector('link[rel="canonical"]');
  if (canonical) {
    const href =
      locale === DEFAULT_LOCALE
        ? `${SITE_ORIGIN}/`
        : `${SITE_ORIGIN}/${locale}/`;
    canonical.setAttribute("href", href);
  }

  // 5. Decide output path: default locale → /index.html, others → /<loc>/index.html.
  const outPath =
    locale === DEFAULT_LOCALE
      ? path.join(ROOT, "index.html")
      : path.join(ROOT, locale, "index.html");

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, root.toString(), "utf8");

  console.log(`✓ ${path.relative(ROOT, outPath)} (${locale})`);
}

// Report any missing translations so partial localisation is visible.
let totalMissing = 0;
for (const [loc, missing] of Object.entries(missingByLocale)) {
  if (missing.length === 0) continue;
  totalMissing += missing.length;
  console.log(`\n⚠  Locale "${loc}" missing ${missing.length} keys:`);
  for (const k of missing.slice(0, 10)) console.log(`   - ${k}`);
  if (missing.length > 10) console.log(`   …and ${missing.length - 10} more.`);
}

console.log(
  `\nDone. Source: template.html + assets/i18n.json. ` +
    `Built ${locales.length} locale${locales.length === 1 ? "" : "s"}.` +
    (totalMissing ? ` ${totalMissing} missing keys total.` : "")
);
