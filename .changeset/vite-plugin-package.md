---
"@stackra/vite-plugin": minor
---

Add `@stackra/vite-plugin`, the Stackra Vite preset. `stackra()` returns the plugins every Stackra Vite build runs:
gen's class-component pass (wired once, never forked), `#stackra/*` resolved to the real files in `.stackra/gen/`
(ADR 0261) and a refusal of `.server` imports in the browser bundle. `stackra.viteConfig(app, options)` builds a
member's whole Vite config from its `stackra.config.ts` and the options gen writes: the target from the mode, React or
Cloudflare Workers with React Router framework mode by render mode, Tailwind v4, per-locale pages served under their
prefix and written there, the PWA's per-locale manifests and `injectManifest` service worker, the desktop renderer's
base and output folder, gzipped bundle budgets, prerendered documents from the entry's `render(url, assets)`, hidden
source maps uploaded to Sentry and deleted, and `__BUILD_TIME__`.
