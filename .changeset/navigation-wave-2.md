---
"@stackra/navigation": minor
---

`ModuleMenu`, the navigation kit's module menu (ADR 0504), on the web and on native. It draws every declared
navigation menu (`Menu({ kind: MenuKind.Navigation })`, collected into the menu registry) in registry order: on the web
as `@stackra/ui`'s Sidebar, with each place's href in the visitor's locale mount and the place under the current path
marked current; on native as `@stackra/ui`'s NavigationList, each place opening its app path through the
`RouterProvider` that `ReactNavigationProvider` binds. `items` replaces the declared menus. The native entry gains
`useMenu` and `useMenus`, at parity with the web hooks. The showcase lists ModuleMenu under Blocks.
