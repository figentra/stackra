---
"@stackra/gen": minor
---

A package with a `src/**/__tests__/<name>.e2e.page.tsx` now gets `.stackra/e2e/` (`index.html`, `main.tsx`, `vite.config.ts`: a small Vite app that renders the page named by the URL path) and `.stackra/playwright.e2e.config.ts`, both built on `@stackra/testing/e2e`. An app, a service or a package with no e2e page gets none of them.
