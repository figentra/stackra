# Feature Specification: `@stackra/navigation` wave 7: routes, layouts, menus, router adapters and the root error boundary

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/navigation` (experience, wave 7) for real: the `Route`, `Layout` and `Menu({ kind })` kinds,
chrome config, the React Router 7 and React Navigation adapters, the root error boundary (ADR 0305 rule 35) and the
router-aware UI (ADR 0303 decision 1), absorbing `@stackra/router`.

## Impact

- **Apps touched**: none (the template's console, web and mobile apps use it, STA-344)
- **Services touched**: none
- **Packages touched**: `packages/experience/navigation` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no table, no tenant data
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decisions 14 to 17, 20 and 25; ADR 0305 rules 2, 3, 35; ADR 0303 decision 1; ADR 0297
  decision 4; ADR 0165; ADR 0324; ADR 0301; ADR 0214; ADR 0307 rule 24)
- **New dependencies**: none outside the catalogs: `react-router` (`catalog:frontend`), `@react-navigation/native`,
  `react-native` (`catalog:mobile`) as optional peers; `zod` (`catalog:`); workspace packages through `workspace:*`
- **Deploy modes**: client and edge library; no network of its own
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/experience/navigation/README.md`, `packages/experience/navigation/AGENTS.md`; the cited ADRs are amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (routing, redirects and a form-body parser at a trust boundary)

## Clarifications

### Session 2026-10-25

The package follows the v3.1 registry row (entries `.`, `./react`, `./native`, `./testing`, absorbing `./router`), its
dependencies (ui, iam react only, platform, seo; clients, i18n, settings and feature-flags as the brief names) and notes
A2 and A3. The choices recorded when it was specified:

- The template imports the old `./router` symbols (`RootErrorBoundary`, `routeAdapter`, `routeContext`, `toLayout`,
  `toPanel`, `toResource`, `toRoot`, `toRoute`, `toSettingsPage`) from `./react`; they are React and React Router code,
  so they live in `./react`, not the isomorphic `.`.
- Registry A3: `RouteProps` is exported from `.` only; the template's `./native` import moves to `.` in STA-344.
- `./contracts` is added for the `RouteCaller` port behind `ctx.query` and `ctx.action` (ADR 0294 decision 15 allows
  it; a package that needs service data defines a port).
- Members of the route context owned by other packages (`session`, `identity`, `actor`, `prefs`, `env`) are an open
  `RouteServices` interface filled by declaration merging and `contributeRouteContext`, the house pattern of
  `ShortcutContext`.
- Panel, settings-page and document routes render pages those packages register (`registerRoutePages`), so navigation
  imports no panel or experience code (panel depends on navigation).

## User Scenarios & Testing

### User Story 1 - Declare routes, layouts and menus (Priority: P1)

An author writes `class SettingsRoute extends Route({ path, layout, title, tab }) { override loader(ctx) {} }`, a layout
with `extends Layout` or `Layout({ targets })`, and `class SiteMenu extends Menu({ kind }) { items(m) {} }`.

**Independent Test**: `src/core/bases/__tests__/route.base.test.ts`, `layout.base.test.ts`, `menu.base.test.ts`,
`src/core/types/__tests__/route-context.type.test.ts`.

1. **Given** a route, **Then** its options are recorded with defaults and `RouteContext<this>` types `params` from the
   path or shape, `search` from the shape, and the layout's data (`ctx.site`).
2. **Given** a bad path, tab order, status, target or menu kind, **Then** the declaration throws a `RangeError`.

### User Story 2 - Link and navigate in the visitor's mount (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/resolve-href.function.test.ts` and the `./react` link and hook tests.

1. **Given** `<Link to={Routes.product} params={{ slug }}>` under `/ar-sa/...`, **Then** the href is `/ar-sa/store/tee`.
2. **Given** `useLocaleHref()(Locale.En)` on `/ar-sa/pricing`, **Then** `/pricing`.
3. **Given** `useNavigation(Navigation)`, **Then** entries the actor's permissions or a flag hide are gone.

### User Story 3 - Load, submit and fail through the adapters (Priority: P1)

**Independent Test**: `src/core/functions/__tests__/create-route-context.function.test.ts`, the `./react` route-object,
adapter and root boundary tests, the `./native` screen and layout-loader tests.

1. **Given** a layout that redirects without a session, **Then** no child loads and the router follows the redirect.
2. **Given** `throw ctx.notFound()`, **Then** the root boundary renders the not-found page with a home link in the mount.
3. **Given** a framework-mode route module, **Then** the loader answers `{ data, seo }` and `meta` writes the head.

### User Story 4 - Test a loader (Priority: P1)

**Independent Test**: `src/testing/functions/__tests__/run-loader.function.test.ts`.

1. **Given** `runLoader(TabsLayout, { session: null })`, **Then** `result` equals `{ redirect: Routes.sign_in, params }`.

## Requirements

- **FR-001**: The member files and the entries `.`, `./contracts`, `./react`, `./native` and `./testing`, and no
  others.
- **FR-002**: (template contract) from `.`: `BackTitle`, `ChromeConfig`, `ChromeConfig$`, `HeaderStyle`, `InferParams`,
  `Layout`, `LayoutContext`, `Menu`, `MenuBuilder`, `MenuItemKind`, `MenuKind`, `MetaContext`, `Presentation`,
  `RenderMode`, `ResolvedMenuItem`, `Route`, `RouteContext`, `RouteProps`, `RouteRef`, `data`, `navigation`,
  `routeRef`, `tabs`; from `./react`: `Link`, `NavLink`, `Outlet`, `RouteForm`, `useHref`, `useLayoutData`,
  `useLocaleHref`, `useMenu`, `useNavigate`, `useNavigation`, `useSubmit` and the folded `./router` symbols; from
  `./native`: `ContextMenu`, `toScreen`, `useLayoutLoader`, `useNavigate`, `useRouteReload`; from `./testing`:
  `createRoutesStub`, `runLoader`.
- **FR-003**: (registry contract) router adapters over React Router 7 and React Navigation from the catalogs; the root
  error boundary on `@stackra/ui`; hrefs in lowercase locale mounts by `@stackra/seo`'s rule; `.` stays isomorphic.
- **FR-004**: `RouteServices` and `RouteLoaderRun` are open for declaration merging; values come from
  `contributeRouteContext` and `registerRouteTestingPart`, so this package imports no identity, tenancy or state code.
- **FR-005**: The form body read by `ctx.formData()` drops prototype segments and oversized list indexes; params that
  break the route's shape are a 404; query entries that break it are dropped.

## Success Criteria

- **SC-001**: Every template import resolves, except the symbols listed under Open items (the barrel tests list the
  exports exactly).
- **SC-002**: Every public symbol has a test beside it; tests run in the separate testing workflow.
- **SC-003**: Format and lint are clean.

## Open items

- `RouteProps` from `./native` (registry A3): exported from `.` only; the template moves its 11 imports in STA-344.
- No `RouteCaller` driver ships here: the clients or query package (or gen's wiring) binds one for the browser and the
  device; on a Worker the adapters call the request's public clients.
- Template shapes owned elsewhere: `ctx.settings.read(TenantSettings, { scope })` (settings' reader takes a page),
  `ctx.session`, `ctx.identity`, `ctx.actor`, `ctx.prefs`, `ctx.env` (identity, iam, state, gen augment
  `RouteServices`), `RouteLoaderRun.tenancy` (tenancy's testing part), the `Form submit={...}` adapter (ui).
- Gen: `registerRoutes(routeTable)` in the generated entry (the console sample does not call it yet), `toRoot({ keys })`
  for client-rendered apps, `useLayoutLoader(TabsLayout, session.status)` in the mobile tree, panel and settings
  packages calling `registerRoutePages`, experience calling `registerDocumentResolver`.
- Not built: the navigation package's own lang catalogue (the boundary and screen strings are English shortcuts), the
  `ShortcutContext` `navigate` member (needs a shortcuts dependency the row does not list), entitlement and
  module-install gating of the navigation tree.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec written with the package (owner mode 2026-10-24: develop now, test later)
