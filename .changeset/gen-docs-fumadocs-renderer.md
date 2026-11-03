---
"@stackra/gen": minor
"@stackra/cli": minor
---

The docs-site target can now write a Fumadocs site. `emitDocsSite(input, "fumadocs")` prerenders the site to static files with Vite and React Router. It writes the pages under `content/`, the navigation as a page tree in `app/site.json`, the site shell, `llms.txt`, `llms-full.txt` and `_redirects` under `public/`, and a transitional map for the Mintlify component names. It refuses a redirect from a page's own path (`docs_redirect_shadows_page`), a redirect to nowhere (`docs_redirect_target_missing`) and an unmapped, unimported component (`docs_component_unknown`). `DocsConfig` gains `redirects`. Mintlify stays the default until a docs app switches (STA-2026). For a docs member whose generated site is Fumadocs, `stackra dev` and `build` run React Router, and they name `pnpm install` when the site's dependencies are missing. `stackra lint` builds the site, then checks every internal link, image and anchor in it, and exits 1 naming each broken link by page.
