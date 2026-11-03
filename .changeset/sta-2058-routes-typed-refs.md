---
"@stackra/gen": minor
"@stackra/navigation": minor
---

Gen writes the bare `.stackra/gen/routes.ts` (`#stackra/routes`) for an app with routes: `Routes`, a typed `routeRef`
per route key across the runtimes (each class a type-only import), and `RouteKey`. A route that writes no `title` gets
the derived key `<module>::routes.<name>.title` in its route table row, and a package's `ui.routes` entry records it as
an optional `title`. The generated `resource(...)` call carries the bound list action's recorded `permission`, so
navigation hides the entry from a viewer without it (STA-2058).

`registerRoutes` accepts an optional `title` per table entry, and `resolveMenuItems` labels a route entry with the
route's own `title`, else the registered one, before the raw route key.
