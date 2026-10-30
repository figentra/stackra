# AGENTS — @stackra/navigation

The `Route`, `Layout` and `Menu` kinds, route refs and contexts, chrome config, the React Router 7 and React Navigation
adapters, the root error boundary and router-aware links. Member at `packages/experience/navigation` (`tier:lib`), in
the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`, `./native`, `./testing`.

## Where code goes

| You are writing…                         | It goes in…                                    |
| ---------------------------------------- | ---------------------------------------------- |
| A kind base (`Route`, `Layout`, `Menu`)  | `src/core/bases/`                              |
| The port behind `ctx.query`/`ctx.action` | `src/contracts/ports/`                         |
| `ChromeConfig`                           | `src/config/chrome.config.ts`                  |
| Context building, hrefs, menus, forms    | `src/core/functions/`                          |
| A type                                   | `src/core/types/` or beside its React code     |
| Web (React Router) code                  | `src/react/<name>/`                            |
| Mobile (React Navigation) code           | `src/native/<name>/`                           |
| A test helper                            | `src/testing/functions/`                       |
| A test                                   | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## This package

- `.` is isomorphic: no React, React Router or React Native import there. `./react` never imports `./native` or the
  reverse; both import `.` internals one way.
- Route keys and titles are derived by gen; never add a `key` option. Links name refs, never paths (registry R-56).
- `loader`, `submit` and `meta` are on the route base (authors write `override`); a menu's `items` is not (no
  `override`), so readers take `RunnableMenu`.
- `RouteServices` and `RouteLoaderRun` stay empty here: other packages add members by declaration merging.
- Hrefs go through `resolveHref` (prefix rule = `@stackra/seo`'s `localePath`, ADR 0297).
- `RouteProps` is exported from `.` only (registry A3); the old `./router` symbols live in `./react`, where the
  template imports them.
- `RootErrorBoundary` needs no container; the adapters report unexpected loader and submit errors.
- The breadcrumb trail (`BreadcrumbsProvider`, `useBreadcrumb`, `useBreadcrumbs`) lives here, in `./react`; panel's
  shell mounts the provider and re-uses the hooks. Panel depends on navigation, never the reverse.
- `toResource` uses panel's page names (`list`, `view`, `create`, `edit`); `RoutePages.resource` takes the same.
- `./testing` builds on `@stackra/testing/react` (an optional peer) and passes the caller's providers through; it adds
  none of its own and imports no tenancy, settings or identity code (their fakes arrive as testing parts).
- `ai: false` and `context` of `Route` are read by gen's client-tool target (`#stackra/client-tools`, ADR 0490); nothing here reads them at run time.
- `src/*/index.ts` are stand-in barrels until gen writes them (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/` or `./testing`.
- Versions are `catalog:<name>` or `workspace:*` only. expo-router is rejected (ADR 0227).

## PII

None stored: routes, menus and labels are code and i18n keys. A form body read by `ctx.formData()` is passed to the
route's own validation and never logged here.
