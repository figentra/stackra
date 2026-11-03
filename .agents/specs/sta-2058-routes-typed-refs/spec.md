# Feature Specification: bare `#stackra/routes`, derived route titles and the list permission on resource routes

**Feature Branch**: `figentra/sta-2058-routes-typed-refs`

**Created**: 2026-11-03

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2058

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-09 of the gen coverage path: write the bare `#stackra/routes` module with
the typed `Routes` refs and `RouteKey` (G-21), derive the default title key of a route that sets none so menus show it
instead of the raw key (G-111), and give the generated resource route constants the list permission the manifest
records (G-112)."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none by hand. Every app with routes gets one more generated file, `.stackra/gen/routes.ts`
  (gitignored); the playground's own route tables gain a `title` per route that sets none.
- **Services touched**: none
- **Packages touched**: packages/developer/gen (owner of this spec); packages/experience/navigation (`registerRoutes`
  takes an optional `title` per table entry, and `resolveMenuItems` falls back to it before the raw key)
- **Public contract change**: additive: a new generated module `#stackra/routes` (`Routes`, `RouteKey`); a package's
  manifest `ui.routes` entry gains an optional `title`; `registerRoutes` accepts an optional `title` per entry; the
  generated `resource(...)` calls gain `permission`. Nothing is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: navigation hides a resource entry the viewer lacks the list permission for (ADR 0307 rule
  4). This is presentation only; the server still refuses the call either way.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0294 decision 20 (route identity `Routes.<key>`, i18n default keys
  `<module>::<kind>.<name>.<part>`), ADR 0322 decision 1 (typed route keys) and ADR 0307 rule 4 as written)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: menus (`resolveMenuItems`) show a route's derived title key instead of its raw key; panel navigation
  drops a resource the viewer cannot list. No component changes.
- **Docs to update**: `packages/developer/gen/README.md` (the `emitRoutes` row and the `#stackra/resources` paragraph);
  `packages/experience/navigation/README.md` (registering routes)
- **Lane**: full
- **Change risk**: R1 (new generated output and optional fields; existing callers keep working)

## Glossary _(full lane)_

- **Route key**: the snake_case of a route's file stem (`order-detail.route.ts` is `order_detail`), `routeKey`; a
  package route's key is `<module>_<stem>` (`uiRoutesOf`).
- **Route ref**: `routeRef<typeof X>("key")` from `@stackra/navigation`, a frozen `{ name }` whose class is a type
  argument only, so a ref never loads a route module.
- **Bare routes module**: `.stackra/gen/routes.ts`, reached as `#stackra/routes` through the member's `#stackra/*`
  imports entry, beside the per-runtime tables `.stackra/gen/routes/<runtime>.ts`.
- **Derived title key**: `<module>::routes.<snake(stem)>.title`, the i18n default key ADR 0294 decision 20 gives a
  route that writes no `title`.
- **List permission**: the `permission` the consumed service's manifest records on the action entry the resource's
  list page binds.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - An app names routes through typed refs (Priority: P1)

An app author writes `import { RouteKey, Routes } from "#stackra/routes"` in a link, a redirect, a menu or a schema
hatch (`z.custom<RouteKey>((key) => Object.hasOwn(Routes, key))`) and it resolves, with each key typed by its route
class.

**Why this priority**: G-21 is high: every authored `Routes.<key>` and `RouteKey` import fails to resolve today, and
four later packages (typed resource trees, the panel kind, the router tree, the key constants) build on it.

**Independent Test**: run `emitRoutes` over the web app IR fixture and read `.stackra/gen/routes.ts`; run the golden
fixture with an app route and compare the expected `routes.ts`.

**Acceptance Scenarios**:

1. **Given** an app with routes `order_detail` and `settings`, **When** gen runs, **Then** `.stackra/gen/routes.ts`
   exports `Routes` with `order_detail: routeRef<typeof OrderDetailRoute>("order_detail")` and
   `settings: routeRef<typeof SettingsRoute>("settings")`, and `RouteKey` as `keyof typeof Routes`.
2. **Given** an app that composes a package route, **When** gen runs, **Then** `Routes` also holds that route under
   its recorded key, its class imported as a type from the package entry that ships it.

---

### User Story 2 - Menus show a route's title, never its raw key (Priority: P2)

A route that sets no `title` gets the derived title key, and a menu entry without a label shows it.

**Why this priority**: G-111 is medium: menus show `order_detail` to users.

**Independent Test**: `routeTitleKey` unit test; the emitted route table row carries `title`; `registerRoutes` and
`resolveMenuItems` unit tests.

**Acceptance Scenarios**:

1. **Given** `src/routes/order-detail/order-detail.route.ts` in app `web` with no `title`, **When** gen runs, **Then**
   its table row is `order_detail: { route: OrderDetailRoute, page: OrderDetailPage, title:
"web::routes.order_detail.title" }`.
2. **Given** that table is registered, **When** a menu lists `Routes.order_detail` with no label, **Then** the entry's
   label is `web::routes.order_detail.title`.
3. **Given** a route that writes `title`, **When** gen runs, **Then** its row carries no `title` and the menu shows
   the written one.

---

### User Story 3 - Navigation hides resources the viewer cannot list (Priority: P2)

The generated `Resources.<Model>` constant carries the list permission, so `useNavigation` drops the entry for a
viewer without it.

**Why this priority**: G-112 is medium: the shell shows items that fail on click.

**Independent Test**: `emitResources` unit test over a consumed service manifest whose list action records a
permission.

**Acceptance Scenarios**:

1. **Given** a resource `loyalty_kit.loyalty_account` whose list binds an action the service records with permission
   `loyalty_kit.loyalty_account.read`, **When** gen runs, **Then** its call is `resource("loyalty_kit.loyalty_account",
{ base: ..., permission: "loyalty_kit.loyalty_account.read", list: ..., ... })`.

---

### Edge Cases

- **EC-01**: An app with no own and no package route gets no `routes.ts` (as today it gets no runtime table).
- **EC-02**: A package route served only on one runtime is still in `Routes` once (the bare module is runtime-free).
- **EC-03**: Two composed route classes with one name keep the module-name alias the runtime tables already use.
- **EC-04**: A resource whose list is unbound (no consumed client exports it, STA-1971) gets no `permission`: there
  is no list page to gate, and no recorded permission to read.
- **EC-05**: A member that is not an app gets no `routes.ts`, as it gets no route tables.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen runs for an app that has its own or composed routes THE `emitRoutes` function SHALL also write
  `.stackra/gen/routes.ts` exporting `Routes`, one `routeRef<typeof <Class>>("<key>")` per route key across every
  client runtime, and `RouteKey = keyof typeof Routes`, with every route class imported as a type only.
- **FR-002**: THE `routeTitleKey` function SHALL derive `<module>::routes.<snake(stem)>.title` from a route's module
  and file.
- **FR-003**: WHEN an app's own route writes no `title` option THE route table row SHALL carry
  `title: "<derived key>"`.
- **FR-004**: WHEN a package's route writes no `title` THE `uiRoutesOf` entry SHALL record the derived `title`, and
  WHEN a host composes a recorded route with a `title` THE host's route table row SHALL carry it.
- **FR-005**: WHEN a table entry carries `title` THE `registerRoutes` function SHALL record it under the route key,
  all or nothing with the batch, and WHEN a route ref's class sets no `title` THE `resolveMenuItems` function SHALL
  label the entry with the recorded title before the raw key.
- **FR-006**: WHEN a resource's list page binds an action the consumed service's manifest records THE generated
  `resource(...)` call SHALL carry that entry's `permission`.

### Key Entities _(include if feature involves data)_

- **Route table row**: `{ route, page?, title? }` per key in `.stackra/gen/routes/<runtime>.ts`.
- **`ui.routes` entry**: `{ key, module, class, entry, path?, page?, title? }` in a package's manifest.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN gen runs for an app with routes THE generator SHALL write `.stackra/gen/routes.ts` so that
  `import { RouteKey, Routes } from "#stackra/routes"` resolves, as the golden app fixture's expected output shows.
- **AC-002**: WHEN a route sets no title THE generator SHALL give it the derived title key, and menus SHALL show it
  instead of the raw key.
- **AC-003**: WHEN a resource's list binds a recorded action THE generated resource route constant SHALL carry the
  list permission from the manifest.

## Success Criteria _(mandatory)_

- **SC-001**: the unit tests of `emitRoutes`, `routeTitleKey`, `uiRoutesOf`, `emitResources`, `registerRoutes` and
  `resolveMenuItems` cover FR-001 to FR-006 — verified by: unit
- **SC-002**: the golden fixture with an app route writes the expected `.stackra/gen/routes.ts` and route table with
  the derived title — verified by: unit (golden runner)
- **SC-003**: `pnpm verify` is green for `@stackra/gen` and `@stackra/navigation` on ci-box — verified by: manual

## Out of scope

- The link map of ADR 0345 decision 4 (React Navigation linking, custom scheme, universal and app links): it has no
  consumer yet and its shape is set by the router tree (wp-70) and the native entry (wp-83); G-21's link-map half stays
  open there.
- Checking that a derived title key exists in the catalogues (G-104, wp-99).
- The router tree (`toRoot`, `toLayout`, `toRoute`, G-22) and locale prefixes (H-14).
- Deriving a list permission for a `true` list that no client exports yet (STA-1971 writes the standard reads).
- Typed resource trees (G-174, wp-71).

## Assumptions

- The routes kind segment is `routes`, plural like `enums` and `resources` in the existing derived keys
  (`<module>::enums.<enum>.<code>`, `<module>::resources.<model>.title`), per ADR 0294 decision 20's
  `<module>::<kind>.<name>.<part>`.
- An app's route classes carry the app's member key as their module (the web IR fixture's `module: "web"`), so its
  derived titles live in the app's own namespace.
- `#stackra/routes` resolves to `.stackra/gen/routes.ts` through the existing `#stackra/*` imports entry
  (`./.stackra/gen/*.ts`); the per-runtime `#stackra/routes/<runtime>` keeps resolving to the folder beside it.
- No committed package manifest records `ui.routes` today, so FR-004 changes no committed manifest.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2058 session) · created
- 2026-11-03 · Draft → Implementing · Claude (STA-2058 session) · plan and tasks; T001 to T010 built
