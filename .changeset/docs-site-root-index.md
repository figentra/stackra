---
"@stackra/gen": patch
---

A generated docs site serves its home page again. The routes had only a top-level splat, which React Router does not
match for `/`, so the root `index.mdx` prerendered as the bare shell and every docs site showed a blank home page. An
index route now serves it through the same page module. The generated `react-router.config.ts` also fails the build
when a page listed in `app/site.json` prerenders without a `<title>`, so a page no route matches cannot ship blank.
