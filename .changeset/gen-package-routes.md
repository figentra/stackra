---
"@stackra/gen": patch
---

A package that ships routes in its `react` or `native` entry gets its `Routes` ref table, `.stackra/gen/routes.ts`
(`#stackra/routes`): one `routeRef` per route stem, keyed `<module>_<stem>` as its manifest's `ui.routes` records and
its host app registers, so the package's own pages link to its routes by ref.
