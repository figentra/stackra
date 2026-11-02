# Feature Specification: gen carries UI from modules and packages into apps

**Feature Branch**: `figentra/sta-1947-gen-ui`

**Created**: 2026-11-02

**Status**: Planned · Approved by leader 2026-11-02

**Tier**: big

**Approver**: leader

**Linear**: STA-1947

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Make `@stackra/gen` carry UI from modules and packages into apps: record every declared
resource tree in the manifest's `ui.resources` with its owning module, register those resources on web and native, and
collect the `Route` classes and menus that dependencies ship in their `react` and `native` entries into the app's
generated entries, so no app hand-writes `register()`."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none (no app in this repository consumes a package route or resource yet; the playground's own
  routes must generate unchanged)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (owner of this spec); packages/experience/navigation (a menu registry,
  see FR-011, pending Q2); packages/experience/panel (read only: `describeResource`, `registerResources`, `resource`)
- **Public contract change**: additive: the committed manifest gains `ui.resources` (every member that declares a
  resource), and a package's manifest gains `ui.routes` and `ui.menus`. No field is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (gen runs resource builder methods at build time; they are pure by contract, and no
  secret, network or database is touched)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0111 d1/d3/d4, 0109 d1, 0164 d2, 0053 d2 and 0307 rule 5 as written)
- **New dependencies**: none in a catalog; `@stackra/gen` may add `vite` from the existing `catalog:frontend` (Q1),
  which changes `pnpm-lock.yaml`
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none drawn by this spec; it makes declared resources, package routes and package menus reach the
  shells that draw them (web now; native as soon as `@stackra/panel/native` has resource pages)
- **Docs to update**: apps/docs/src/docs pages on gen output and the manifest (`ui` section); the `@stackra/gen`
  README
- **Lane**: full
- **Change risk**: R2 (a committed contract every host reads gains a section)

## Glossary _(full lane)_

- **Resource tree**: what `describeResource` returns for one `Resource<Model>({...})` class: its options and the node
  each overridden builder member (`table`, `views`, `form`, `infolist`, `relations`, `actions`) returns.
- **Host**: the app (or service) whose gen run composes the UI of its dependencies.
- **Contributing member**: a package or service whose manifest a host reads (`ir.dependencies`, `ir.services`).
- **Route table**: `#stackra/routes/<runtime>`, the file gen writes per client runtime that registers routes.
- **Client runtime entry**: `.stackra/entry/browser.ts` and `.stackra/entry/native.ts`, which load the route tables.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A declared resource is recorded with its module (Priority: P1)

A module author declares `OrderResource extends Resource<Order>({...})` in a package or service. After `stackra gen`,
the member's committed manifest lists it under `ui.resources["orders.order"]` with its owning module, its class, the
specifier a host imports it from, its options (operations as locked action keys) and its tree.

**Why this priority**: no manifest records a resource today, so none of commerce's 99 resources reaches a shell. This
one record unblocks about 600 inventory rows.

**Independent Test**: run gen on a fixture package with one resource and read `ui.resources` from the manifest.

**Acceptance Scenarios**:

1. **Given** the package module `loyalty_kit` with `LoyaltyAccountResource`, **When** gen runs, **Then** the manifest has
   `ui.resources["loyalty_kit.loyalty_account"]` with `module: "loyalty_kit"`, the class name, the import specifier and the
   tree its builder members return.
2. **Given** a member with no resource, **When** gen runs, **Then** its manifest has no `ui.resources` and is
   byte-identical to before.
3. **Given** a resource whose builder member reads anything but its argument, **When** gen runs, **Then** gen refuses
   with `builder_impure`, naming the file and member.

---

### User Story 2 - Recorded resources are registered on web and native (Priority: P1)

An app that hosts `@stackra/panel` and depends on (or consumes a client of) a member that records resources gets those
trees registered in both its browser and its native route tables, with the label keys they derive.

**Why this priority**: ADR 0164 d2 says the panel draws on web and native; today gen registers on the browser only.

**Independent Test**: an app IR with web and native targets and one dependency recording a resource; both generated
route tables call `registerResources` with the tree.

**Acceptance Scenarios**:

1. **Given** an app with web and native targets hosting the panel, **When** gen runs, **Then** `routes/browser.ts`
   and `routes/native.ts` both register the recorded trees, and only the browser one calls `registerPanelPages()`.
2. **Given** two contributing members that record the same resource key, **When** gen runs, **Then** gen refuses with
   `resource_duplicate`, naming both members (instead of today's silent first-wins).

---

### User Story 3 - Package routes and menus reach the app without a hand-written register() (Priority: P1)

A package ships `Route` classes (with their pages beside them) and `Menu` classes in its `react` and `native`
entries. A host app that depends on it gets those routes in its route table for that runtime, and those menus
registered, by gen alone.

**Why this priority**: the owner's rule is that packages ship their own UI and apps only compose it; today an app
must hand-write `register()` for every package route.

**Independent Test**: a package fixture with one route and one menu, and an app fixture depending on it; the app's
route table lists the package route with the package's page, and the menu is registered.

**Acceptance Scenarios**:

1. **Given** a package with `src/react/orders/orders.route.ts` and `orders.tsx`, **When** the package's gen runs,
   **Then** its manifest lists the route under `ui.routes` with its key, module, class, entry and page per runtime.
2. **Given** an app that depends on that package, **When** the app's gen runs, **Then** `routes/browser.ts` imports
   the route and its page from `<package>/react` and lists them; `routes/native.ts` lists the route with the native
   page when the package ships one, and without a page otherwise.
3. **Given** a package menu `OrdersMenu`, **When** the app's gen runs, **Then** the app's route table registers it
   under its key so the shell's menu renderer can list it.
4. **Given** an app route key that equals a package route key, **When** gen runs, **Then** gen refuses with
   `route_duplicate`, naming both owners.

---

### User Story 4 - An app with no UI dependencies is unchanged (Priority: P2)

An app that depends on nothing that records `ui` gets exactly the generated output it gets today.

**Independent Test**: the playground app's generated route tables and manifest are byte-identical before and after.

**Acceptance Scenarios**:

1. **Given** the playground app, **When** gen runs, **Then** no generated file changes.

---

### User Story 5 - Commerce's resources are recorded (Priority: P2)

On ci-box box 1, gen run against products/commerce records every declared resource. The count is reported to the
leader; nothing is committed to commerce.

### Edge Cases

- **EC-01**: A resource class that cannot be loaded at gen time (a load error in an import) → gen refuses with
  `resource_unloadable`, naming the file and the load error; it never writes a manifest with a partial tree.
- **EC-02**: A resource whose operations name an action or query class of another member → the operation is recorded
  by that class's locked action key from the owner's manifest; an unknown class is refused (`resource_operation_unknown`).
- **EC-03**: An older manifest with no `ui` section → read as no resources, routes or menus (no refusal).
- **EC-04**: A `ui.resources` entry with no `module`, `class` or `from` (a bare tree, the shape today's readers expect)
  → still read as a tree; the entry is a superset of the tree, so `emit-routes`, `client-tools-of` and
  `check-table-indexes` read both shapes unchanged.
- **EC-08**: A service that hosts a package records the package's resources too (as it merges its other sections);
  the same key reaching a host twice with the same `module` and `class` is one resource, not a duplicate.
- **EC-05**: A package route with no page for a runtime → registered without a page on that runtime, so its
  `Routes.<key>` ref still resolves (today's rule for app routes).
- **EC-06**: A host that does not host `@stackra/panel` → resource trees are not registered (today's rule), routes and
  menus still are.
- **EC-07**: A route or menu in a package's `node` or core entry → not a UI contribution; gen ignores it for `ui.routes`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen runs on a member that declares a `Resource` class THE gen SHALL record it in the manifest under
  `ui.resources["<module>.<model>"]` with `module`, `class`, `from` (the specifier a host imports it from), `options`
  and every tree member the class overrides.
- **FR-002**: WHEN gen records a resource THE gen SHALL obtain its tree by running the class's builder members once,
  as `describeResource` does, with no constructor and no dependency run.
- **FR-003**: WHEN a resource's options name an operation class THE gen SHALL record the operation as that class's
  locked action key (`orders.order.list@1`), never as a function.
- **FR-004**: IF a resource cannot be loaded or a builder member is impure THEN THE gen SHALL refuse with
  `resource_unloadable` or `builder_impure` and write no manifest.
- **FR-005**: WHEN a host app hosts `@stackra/panel` THE gen SHALL register every recorded resource tree of its
  dependencies and consumed services in the route table of each client runtime it targets, browser and native.
- **FR-006**: WHEN two contributing members record the same resource key with a different `module` or `class` THE gen
  SHALL refuse with `resource_duplicate`.
- **FR-007**: WHEN gen runs on a package whose `react` or `native` entry declares `Route` classes THE gen SHALL record
  each under `ui.routes` with its key, module, class, entry and the page it has on each runtime.
- **FR-008**: WHEN gen runs on a package whose `react` or `native` entry declares `Menu` classes THE gen SHALL record
  each under `ui.menus` with its key, module, class, entry and kind.
- **FR-009**: WHEN gen runs on a host app THE gen SHALL list in its route table for each runtime every dependency
  route recorded for that runtime, imported from the dependency's public entry, with its page when it has one.
- **FR-010**: IF a dependency route key equals another route key in the same host THEN THE gen SHALL refuse with
  `route_duplicate`.
- **FR-011**: WHEN a host app's dependencies record menus THE gen SHALL register them by key in the route table of
  each runtime the menu's entry serves, so a shell lists them without naming their classes.
- **FR-012**: WHEN gen runs on an app with no dependency that records `ui` THE gen SHALL write output byte-identical
  to the output before this change.
- **FR-013**: WHEN gen reads a dependency manifest with no `ui` section THE gen SHALL treat it as contributing
  nothing, and WHEN it reads a `ui.resources` entry with no `module` THE gen SHALL read it as a bare tree.
- **FR-014**: WHEN a host app registers recorded resources THE gen SHALL write `#stackra/resources`, the route
  constants of each resource (`resource(key, { base, list, view, create, update, delete })`) with operation refs from
  the host's generated clients (pending Q3).

### Key Entities

- **`ui.resources` entry**: key `<module>.<model>`; the resource tree as `describeResource` returns it (`options`
  with operations as action keys, then `table`, `views`, `form`, `infolist`, `relations`, `actions`), plus `module`,
  `class` and `from` (absent for a service resource, which no host imports).
- **`ui.routes` entry**: `key`, `module`, `class`, `entry` (`react` or `native`), `path`, `pages` per runtime
  (`browser`, `native`, each the page's export name), all imported from `<package>/<entry>`.
- **`ui.menus` entry**: `key`, `module`, `class`, `entry`, `kind`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN gen runs on loyalty-kit THE manifest SHALL record `ui.resources["loyalty_kit.loyalty_account"]` with
  `module: "loyalty_kit"` and its tree.
- **AC-002**: WHEN a panel host targets web and native THE gen SHALL register each recorded tree in both route tables
- **AC-003**: WHEN an app depends on a package route and menu THE gen SHALL list and register them in its route tables
- **AC-004**: WHEN gen runs on an app with no UI dependency THE generated files SHALL not change.
- **AC-005**: IF two contributors record the same resource or route key THEN THE gen SHALL refuse with
  `resource_duplicate` or `route_duplicate`.

## Success Criteria _(mandatory)_

- **SC-001**: Every resource declared in this repository is recorded in its member's committed manifest — verified
  by: unit (gen fixture) and `stackra gen --check` on loyalty-kit.
- **SC-002**: A resource tree reaches the route tables of both client runtimes — verified by: unit.
- **SC-003**: A package route and menu reach an app with zero lines written in the app — verified by: unit.
- **SC-004**: The playground's generated output is unchanged — verified by: unit plus `stackra gen --check` on ci-box.
- **SC-005**: commerce's gen output on ci-box box 1 records all of its declared resources (99 expected by the
  inventory); the count is reported to the leader — verified by: manual.

## Out of scope

- Native resource list, detail and form pages and the native action dialog in `@stackra/panel/native` (inventory
  build-order item 7). This spec registers the trees on native; drawing them is that item.
- Nesting resource routes under the panel shell (`PanelRoutePage` shortcut, STA-339).
- Services' `react`/`native` entries: a service has none (inventory answer, ADR 0259 home B); a hand-coded OS screen
  lives in an `@figentra/*` package, which this spec covers as any package.
- Declaring resources in commerce, OS or other products; committing to commerce.
- The extension-bundle and import-map loading of ADR 0436 (proposed).
- The CLI console entry (`.stackra/entry/console.ts`, ADR 0506), which runs commands, not UI.

## Assumptions

- "The generated console entry" in the issue means the app's generated client runtime entries and the route tables
  they load (`.stackra/entry/{browser,native}.ts` → `#stackra/routes/<runtime>`), not the CLI console entry. The route
  tables are where packages' routes, menus and resources are registered.
- The manifest has no format version to bump: its `version` field is the member's package version, and the `ui`
  section is open (`[section: string]: unknown`). The change is additive; readers treat a missing section as empty.
  `ui.resources` keeps the shape gen's three readers already expect (the tree), with three fields added, so no reader
  changes shape; and no committed manifest on any repository's main records `ui.resources` yet (inventory,
  2026-11-02).
- Resource builder members are pure by contract (ADR 0307 rule 5, `describeResource`), so running them at gen time is
  safe.
- Resource files cannot be imported with Node's type stripping (their schemas and actions carry decorators), so gen
  loads them the way `stackra console` loads its entry: through Vite's module runner with the legacy decorator
  transform (Q1).

## Clarifications

### Session 2026-11-02 (leader)

- Q1 → (a): the CLI passes gen a Vite `runnerImport` loader; with no loader gen refuses `resource_loader_missing`,
  and the refusal names `stackra gen` as the command to run. No lockfile change.
- Q2 → yes: `registerMenus`, `MENU_REGISTRY` and `useMenus()` go in `@stackra/navigation`; the generated menu table
  is also exported from `#stackra/routes/<runtime>`, and the registry is fed from it.
- Q3 → yes: `#stackra/resources` (FR-014) is in this issue.
- "The generated console entry" is the client runtime entries and their route tables, as assumed.
- No manifest schema bump; the `StackraManifest.version` doc comment is corrected in passing.
- Registering trees on native while `@stackra/panel/native` draws nothing yet is accepted; the PR says so.
- Delivery: three PRs, in order: (1) the loader and `ui.resources`; (2) `#stackra/resources` and registration on
  web and native; (3) the menu registry and package route and menu collection. Each with a changeset, box-verified.

## Amendments

None.

## Status history

- 2026-11-02 · — → Draft · Claude (STA-1947 session) · created
- 2026-11-02 · Draft → Clarified · leader · Approved by leader 2026-11-02 (spec; Q1 a, Q2 yes, Q3 yes)
- 2026-11-02 · Clarified → Planned · leader · Approved by leader 2026-11-02 (plan)
