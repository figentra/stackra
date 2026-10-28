/**
 * Stackra file contract:
 * Purpose: `handleLanding`: the registry's one HTML page, served at `/`: a branded note that says what the host is,
 *          gives the `.npmrc` line and points people at the docs.
 * Boundary: builds a Response only. The page is self-contained: inline CSS and SVG, no script, no external request.
 * Runtime: worker
 * Governing contract: ADR 0453; the stackra theme of @stackra/tokens (as workers/static's render-page.ts).
 */
import { STACKRA_WORDMARK_SVG } from "#src/constants/stackra-wordmark-svg.constant";

/** Where people who land on the host by hand should go instead. */
const DOCS_URL = "https://docs.stackra.figentra.com";

/**
 * The stackra theme's colours, type and spacing, copied from workers/static's render-page.ts (which copies them from
 * packages/design-system/tokens/assets/public/themes/stackra/web.css); re-copy them when the theme changes.
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
pre {
  margin: 0 0 24px;
  padding: 12px 16px;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  font: 400 14px/1.5 "Geist Mono", ui-monospace, monospace;
}
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

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Stackra registry</title>
<style>${STYLE}</style>
</head>
<body>
<main>
${STACKRA_WORDMARK_SVG}
<h1>Stackra registry</h1>
<p>This host serves Stackra packages to npm, pnpm and Yarn. There is no website to browse. To install from it, add this line to your project’s <code>.npmrc</code>:</p>
<pre>@stackra:registry=https://npm.stackra.figentra.com/</pre>
<p>Looking for Stackra? <a href="${DOCS_URL}">Read the documentation</a>.</p>
</main>
<footer>© Figentra Technologies L.L.C</footer>
</body>
</html>
`;

/**
 * The landing page: public, cached for five minutes, and locked down by its CSP (no script, no request).
 *
 * @example
 * handleLanding(); // 200 text/html
 */
export function handleLanding(): Response {
  return new Response(PAGE, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "content-security-policy":
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}
