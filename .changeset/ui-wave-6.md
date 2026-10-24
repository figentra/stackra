---
"@stackra/ui": minor
"@stackra/navigation": minor
---

Wave 6: the shared shell contracts of `@stackra/ui` (navigation item, landmark, bar slots, title block and layout
breakpoint) and the new `@stackra/navigation` package that holds the router bindings (ADR 0314).

`@stackra/ui` adds `AppShell`, `Sidebar`, `NavigationList`, `AppHeader`, `PageHeader`, `Section`,
`SingleColumnLayout`, `TwoColumnLayout`, `Screen` and `NavigationHeader` for web and native, and the native `TabBar`,
with their contracts.

`@stackra/navigation` adds `./contracts`, `./react` (React Router 7) and `./native` (React Navigation 7): `RouteOverlay`
with `useRouteOverlay`, the router providers that fill the kit's link seam, and `RouteLeaveConfirmation`.
