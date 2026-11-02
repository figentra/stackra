---
"@stackra/gen": minor
"@stackra/navigation": minor
---

A package records the `Route` and `Menu` classes of its `react` and `native` entries in its manifest (`ui.routes`, with
the page beside each route, and `ui.menus`), and an app's route tables list them on the runtime their entry serves,
imported from `<package>/<entry>`, so no app hand-writes a `register()`. Every menu, the app's own and its packages',
is registered under its key through the new `registerMenus` of `@stackra/navigation`, and `useMenus(kind?)` lists them
for a shell. One route or menu key from two owners is refused (`route_duplicate`, `menu_duplicate`) (STA-1947).
