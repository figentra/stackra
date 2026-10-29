/**
 * Stackra file contract:
 * Purpose: `BROWSE_STYLE`: the registry browser's stylesheet: the stackra theme of @stackra/tokens (colours in light
 *          and dark, radius, the Latin and Arabic type scales, motion), the layout, the page progress bar and the page
 *          transitions, with logical properties so the Arabic pages mirror.
 * Boundary: a constant only, inlined in every page (no external request).
 * Runtime: worker
 * Governing contract: ADR 0453; ADR 0302 (tokens); the stackra theme,
 *                     packages/design-system/tokens/assets/public/themes/stackra/web.css.
 */

/**
 * The values are copied from the stackra theme's web.css (a worker may not import a package's assets at runtime);
 * re-copy them when the theme changes. The fonts are named, not loaded: the CSP allows no font request.
 */
export const BROWSE_STYLE = `
:root {
  color-scheme: light dark;
  --background: oklch(0.972 0.004 122);
  --foreground: oklch(0.158 0.005 248);
  --surface: oklch(1 0 0);
  --surface-secondary: oklch(0.955 0.004 110);
  --muted: oklch(0.49 0.01 250);
  --accent: oklch(0.546 0.03 252);
  --accent-soft: oklch(0.94 0.012 252);
  --accent-soft-foreground: oklch(0.4 0.03 252);
  --warning: oklch(0.55 0.15 47);
  --amber: oklch(0.83 0.15 82);
  --amber-strong: oklch(0.47 0.095 75);
  --field-background: oklch(1 0 0);
  --field-border: oklch(0.6 0.008 250);
  --border: oklch(0.885 0.005 110);
  --separator: oklch(0.92 0.004 110);
  --focus: oklch(0.546 0.03 252);
  --wordmark: oklch(0.24 0.015 248.4);
  --surface-shadow: 0px 0px 0px 1px oklch(0.158 0.005 248 / 0.06), 0px 1px 2px 0px oklch(0.158 0.005 248 / 0.06);
  --radius: 0.25rem;
  --radius-lg: 6px;
  --radius-full: 9999px;
  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", "Menlo", monospace;
  --font-arabic: "IBM Plex Sans Arabic", "Geist", system-ui, "Segoe UI", "Tahoma", sans-serif;
  --body: 400 16px/1.6 var(--font-sans);
  --small: 400 14px/1.5 var(--font-sans);
  --caption: 500 12px/1.4 var(--font-sans);
  --h1: 600 40px/1.1 var(--font-sans);
  --h2: 600 28px/1.2 var(--font-sans);
  --h3: 600 20px/1.3 var(--font-sans);
  --mono: 400 14px/1.7 var(--font-mono);
  --label: 500 11px/1.4 var(--font-mono);
  --duration-fast: 150ms;
  --ease-fast: ease-out;
  --duration-base: 250ms;
  --ease-base: ease-in-out;
  --duration-reveal: 400ms;
  --ease-reveal: cubic-bezier(0.22, 1, 0.36, 1);
}
:root[lang="ar"] {
  --body: 400 17px/1.8 var(--font-arabic);
  --small: 400 15px/1.7 var(--font-arabic);
  --caption: 500 13px/1.6 var(--font-arabic);
  --h1: 600 38px/1.35 var(--font-arabic);
  --h2: 600 30px/1.4 var(--font-arabic);
  --h3: 600 21px/1.5 var(--font-arabic);
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.158 0.005 248);
    --foreground: oklch(0.972 0.004 122);
    --surface: oklch(0.195 0.006 250);
    --surface-secondary: oklch(0.235 0.007 250);
    --muted: oklch(0.72 0.008 250);
    --accent: oklch(0.77 0.03 252);
    --accent-soft: oklch(0.29 0.015 252);
    --accent-soft-foreground: oklch(0.88 0.02 252);
    --field-background: oklch(0.195 0.006 250);
    --field-border: oklch(0.45 0.008 250);
    --border: oklch(0.35 0.008 250);
    --separator: oklch(0.285 0.007 250);
    --focus: oklch(0.77 0.03 252);
    --wordmark: oklch(0.931 0.012 248);
    --surface-shadow: 0px 0px 0px 1px oklch(0.972 0.004 122 / 0.08);
  }
}
@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-reveal: 0ms; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none; }
}
* { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
  margin: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font: var(--body);
}
.progress {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: 10;
  height: 2px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  opacity: 0;
  pointer-events: none;
}
[dir="rtl"] .progress { transform-origin: right; }
.progress[data-state="loading"] {
  opacity: 1;
  transform: scaleX(0.8);
  transition: transform 8s var(--ease-reveal), opacity var(--duration-fast) var(--ease-fast);
}
.progress[data-state="done"] {
  opacity: 0;
  transform: scaleX(1);
  transition: transform var(--duration-base) var(--ease-base), opacity var(--duration-reveal) var(--ease-base) var(--duration-base);
}
.skip {
  position: absolute;
  inset-inline-start: 16px;
  inset-block-start: -48px;
  padding: 8px 12px;
  border-radius: var(--radius);
  background: var(--foreground);
  color: var(--background);
}
.skip:focus { inset-block-start: 12px; }
header, main, footer > div { width: 100%; max-width: 1040px; margin-inline: auto; padding-inline: 16px; }
header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
  padding-block: 20px;
  border-block-end: 1px solid var(--separator);
  max-width: none;
}
header > * { flex-shrink: 0; }
.brand { display: flex; align-items: center; gap: 10px; color: var(--wordmark); text-decoration: none; }
.brand svg { display: block; height: 24px; width: auto; }
.brand span { font: var(--label); text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
header form { flex: 1 1 240px; max-width: 520px; }
header nav { display: flex; gap: 16px; margin-inline-start: auto; font: var(--small); }
input[type="search"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--field-border);
  border-radius: var(--radius);
  background: var(--field-background);
  color: var(--foreground);
  font: var(--small);
  transition: border-color var(--duration-fast) var(--ease-fast);
}
input[type="search"]::placeholder { color: var(--muted); }
main {
  flex: 1;
  padding-block: 40px 64px;
  overflow-wrap: anywhere;
  animation: reveal var(--duration-reveal) var(--ease-reveal);
  view-transition-name: main;
}
@keyframes reveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
h1 { margin: 0 0 8px; font: var(--h1); letter-spacing: -0.02em; }
:root[lang="ar"] h1 { letter-spacing: 0; }
h1:focus { outline: none; }
h2 { margin: 40px 0 12px; font: var(--h2); letter-spacing: -0.01em; }
h3 { margin: 32px 0 8px; font: var(--h3); }
h4, h5, h6 { margin: 24px 0 8px; font-weight: 600; }
p, ul, ol, table, blockquote, dl { margin: 0 0 16px; }
.lead { color: var(--muted); max-width: 640px; }
.muted { color: var(--muted); }
.small { font: var(--small); }
.badge {
  display: inline-block;
  padding: 0 8px;
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  color: var(--accent-soft-foreground);
  font: var(--caption);
  line-height: 20px;
  vertical-align: middle;
}
.badge.pro { background: var(--amber); color: oklch(0.158 0.005 248); }
.badge.warn { background: transparent; border: 1px solid var(--warning); color: var(--warning); }
.group h2 {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font: var(--label);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.cards {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.card {
  position: relative;
  height: 100%;
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--surface-shadow);
  transition: transform var(--duration-fast) var(--ease-fast), box-shadow var(--duration-fast) var(--ease-fast);
}
.card:hover { transform: translateY(-1px); box-shadow: var(--surface-shadow), 0 6px 16px -8px oklch(0.158 0.005 248 / 0.2); }
.card a { font-weight: 600; text-decoration: none; }
.card a::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.card p { margin: 6px 0 0; font: var(--small); color: var(--muted); }
.card .meta { display: flex; gap: 8px; align-items: center; margin-top: 10px; font: var(--caption); color: var(--muted); }
.layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 48px; margin-top: 24px; }
@media (max-width: 820px) { .layout { grid-template-columns: minmax(0, 1fr); gap: 24px; } }
aside { display: flex; flex-direction: column; gap: 24px; }
aside section { padding: 16px; border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--surface-shadow); }
aside h2 { margin: 0 0 8px; font: var(--label); text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
aside dl { margin: 0; font: var(--small); }
aside dt { margin-top: 12px; font: var(--caption); color: var(--muted); }
aside dt:first-child { margin-top: 0; }
aside dd { margin: 0; }
aside ul { list-style: none; padding: 0; margin: 0; font: var(--small); }
aside li { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; border-block-end: 1px solid var(--separator); }
aside li:last-child { border-block-end: 0; }
.note {
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  border-inline-start: 3px solid var(--amber);
  background: var(--surface-secondary);
  font: var(--small);
}
code, pre, kbd { font: var(--mono); }
:not(pre) > code { padding: 1px 5px; border-radius: var(--radius); background: var(--surface-secondary); font-size: 0.9em; }
pre {
  margin: 0 0 16px;
  padding: 12px 16px;
  overflow-x: auto;
  border-radius: var(--radius-lg);
  background: var(--surface-secondary);
  direction: ltr;
  text-align: left;
}
.readme { min-width: 0; }
.readme h1 { font: var(--h2); margin-top: 0; }
.readme img { max-width: 100%; }
table { border-collapse: collapse; display: block; overflow-x: auto; font: var(--small); }
th, td { padding: 6px 16px 6px 0; border-block-end: 1px solid var(--separator); text-align: start; vertical-align: top; }
th { font-weight: 600; }
blockquote { padding-inline-start: 12px; border-inline-start: 3px solid var(--border); color: var(--muted); }
hr { border: 0; border-block-start: 1px solid var(--separator); margin: 32px 0; }
a { color: var(--foreground); text-underline-offset: 3px; text-decoration-color: var(--border); transition: text-decoration-color var(--duration-fast) var(--ease-fast); }
a:hover { text-decoration-color: currentColor; }
a:focus-visible, input:focus-visible, h1:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: var(--radius); }
footer { padding-block: 24px; border-block-start: 1px solid var(--separator); color: var(--muted); font: var(--small); }
footer > div { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
`;
