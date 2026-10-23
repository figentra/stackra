/**
 * Stackra file contract:
 * Purpose: render the host's one HTML page, served at `/` (index.html) and for every unknown path (404.html): a branded
 *          "nothing to see here" note that points people at the docs.
 * Boundary: pure; returns text. The page is self-contained: inline CSS and SVG, no script, no external request.
 * Runtime: node
 * Governing contract: ADR 0284 (hosted static files); the stackra theme of @stackra/tokens.
 */
import { STACKRA_WORDMARK_SVG } from "#src/constants";

/** Where people who land on the host by hand should go instead. */
const DOCS_URL = "https://docs.stackra.figentra.com";

/**
 * Colours, type and spacing are the stackra theme's (packages/design-system/tokens/assets/public/themes/stackra/web.css):
 * background, foreground, muted and border roles, steel-deep (light) or steel (dark) for the wordmark, the Geist stack
 * and the h2, body and small type steps. Copied, not linked, because the page may not make a request; re-copy them
 * when the theme changes.
 */
const STYLE = `
:root {
  color-scheme: light dark;
  --background: oklch(0.972 0.004 122);
  --foreground: oklch(0.158 0.005 248);
  --muted: oklch(0.5 0.01 250);
  --border: oklch(0.885 0.005 110);
  --wordmark: oklch(0.24 0.015 248.4);
}
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.158 0.005 248);
    --foreground: oklch(0.972 0.004 122);
    --muted: oklch(0.72 0.008 250);
    --border: oklch(0.35 0.008 250);
    --wordmark: oklch(0.931 0.012 248);
  }
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  display: flex;
  flex-direction: column;
  background: var(--background);
  color: var(--foreground);
  font: 400 16px/1.6 "Geist", ui-sans-serif, system-ui, sans-serif;
}
main {
  flex: 1;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 72px 24px 48px;
}
main svg { display: block; height: 40px; width: auto; color: var(--wordmark); }
h1 { margin: 48px 0 12px; font-size: 28px; line-height: 1.2; font-weight: 600; letter-spacing: -0.02em; }
p { margin: 0 0 24px; }
a { color: var(--foreground); text-underline-offset: 3px; }
a:focus-visible { outline: 2px solid var(--foreground); outline-offset: 2px; border-radius: 0.25rem; }
footer {
  padding: 24px;
  border-top: 1px solid var(--border);
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}
`;

/**
 * Render the page. It names no path, so the same text is correct at `/` and as the 404 body anywhere below it.
 *
 * @returns a complete HTML document, ending with a newline.
 */
export function renderPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="robots" content="noindex">
<title>Stackra static files</title>
<style>${STYLE}</style>
</head>
<body>
<main>
${STACKRA_WORDMARK_SVG}
<h1>Nothing to see here</h1>
<p>This host serves Stackra’s static files, such as JSON Schemas, to editors and tools. There is no website to browse.</p>
<p>Looking for Stackra? <a href="${DOCS_URL}">Read the documentation</a>.</p>
</main>
<footer>© Figentra Technologies L.L.C</footer>
</body>
</html>
`;
}
