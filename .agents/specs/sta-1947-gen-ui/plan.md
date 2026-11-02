# Implementation Plan: gen carries UI from modules and packages into apps

**Spec**: `.agents/specs/sta-1947-gen-ui/spec.md` · **Linear**: STA-1947 · **Date**: 2026-11-02

**Input**: Feature specification from `.agents/specs/sta-1947-gen-ui/spec.md`

Draft written before clarify so the leader sees spec and plan together. It assumes the recommended answers to
Q1 (a loader option, no lockfile change), Q2 (a menu registry in `@stackra/navigation`) and Q3 (`#stackra/resources`
in scope). A different answer changes the step it names and nothing else.

## Summary

Three passes over data gen already has, plus one load step:

1. **Record** (contributing member's gen): resource trees into `ui.resources`, and a package's `react`/`native`
   `Route` and `Menu` classes into `ui.routes` and `ui.menus`.
2. **Compose** (host app's gen): `emit-routes` reads `ui.*` from every dependency and consumed-service manifest and
   writes package routes, menus and resource trees into the route table of each client runtime, browser and native.
3. **Resource routes**: the host writes `#stackra/resources` (route constants with operation refs from its generated
   clients), so each registered tree has pages to land on.

The only non-pure step is getting a tree: the node layer loads each resource class through a loader the CLI passes
(Vite's module runner, as `stackra console` does) and calls the member's own `describeResource`. Core stays pure.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`), `packages/developer/cli` (`tier:lib`, passes the loader),
  `packages/experience/navigation` (`tier:lib`, the menu registry, Q2)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), on ci-box box 1 only
- **Storage**: none
- **Runtime target**: a library (the compiler) and its generated files

## Constitution Check

| Law                                   | Result | Note                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | host imports package entries only; service trees travel as JSON        |
| Secrets (ADR 0009)                    | PASS   | none touched                                                           |
| Security                              | PASS   | builder members are pure; loaded at build time, no network             |
| HTTP and events                       | N/A    | no action, query or event changes                                      |
| Tenancy                               | N/A    | no data                                                                |
| Delegation                            | PASS   | gen files only; other sessions' gen areas untouched                    |
| Not built yet (ADR 0011)              | PASS   | nothing new introduced                                                 |
| Test placement (ADR 0022)             | PASS   | `__tests__/` beside each subject                                       |
| Versions and catalogs                 | PASS   | no catalog change (Q1 loader option)                                   |
| Deploy modes (ADR 0076)               | PASS   | build-time only                                                        |
| Licence tier (ADR 0077)               | PASS   | free                                                                   |
| Docs and ADRs                         | PASS   | gen docs page and README updated; no ADR (implements 0111, 0164, 0307) |

## Deploy modes

| Mode       | Behaviour                    |
| ---------- | ---------------------------- |
| SaaS       | same: build-time output only |
| On-prem    | same                         |
| Air-gapped | same                         |

## Correctness properties

- **P-001**: each declared resource is one `ui.resources` entry with its module and tree — Validates: FR-001, FR-002
- **P-002**: a load failure or impure builder yields a refusal and no written manifest — Validates: FR-004
- **P-003**: an operation class is recorded as its locked action key, or refused — Validates: FR-003
- **P-004**: each client runtime of a panel host registers every recorded tree once — Validates: FR-005
- **P-005**: one resource key from two classes is refused — Validates: FR-006
- **P-006**: each `react`/`native` route of a package is recorded with its pages — Validates: FR-007
- **P-007**: each `react`/`native` menu of a package is recorded with its kind — Validates: FR-008
- **P-008**: a host's route table for runtime R lists its dependencies' routes for R — Validates: FR-009
- **P-009**: one route key from two owners is refused — Validates: FR-010
- **P-010**: a host registers its dependencies' menus from the generated menu table — Validates: FR-011
- **P-011**: an IR whose dependencies record no `ui` produces the same files as before — Validates: FR-012, FR-013
- **P-012**: `#stackra/resources` holds one `resource(...)` per registered tree — Validates: FR-014

## Architecture overview

```
contributing member gen                         host app gen
───────────────────────                         ────────────
discover → ir.classes (resource, route, menu)   discover → ir.dependencies[].manifest.ui
   │                                               │      ir.services[].manifest.ui
   ├─ node: readResourceTrees(loader) ──┐          │
   │   (load class, describeResource)   │          ├─ emit-routes (per runtime: browser, native)
   └─ core: build-manifest ◄────────────┘          │    own routes + package routes + pages
          ui.resources / ui.routes / ui.menus      │    registerMenus(menuTable)
          (committed stackra.manifest.json)        │    registerResources(trees)  [panel hosts]
                                                   │    registerPanelPages()     [browser only]
                                                   └─ emit-resources → #stackra/resources
```

The client runtime entries already import `#stackra/routes/<runtime>`; they need no change.

## Components and responsibilities

- **`readResourceTrees(root, ir, loader)`** (node, new): writes one cache module `.stackra/cache/resource-trees.ts`
  that imports `describeResource` from the member's own `@stackra/panel` and every resource class, loads it once
  through `loader` (one runner, so one `kindOf` registry), and returns `{ "<module>.<model>": tree }`. Errors become
  `resource_unloadable` / `builder_impure`.
- **`MemberIR.resourceTrees`** (type, new optional field): the trees, absent in an IR built by hand.
- **`resourcesOf(ir)`** (core, new): the `ui.resources` entries: key from module + partner model key, `class`,
  `from` (`packageSpecifier` for a package; absent for a service), `options` with operations mapped to action keys
  through own classes and dependency manifests (`resource_operation_unknown` otherwise), and the tree members.
- **`uiRoutesOf(ir)` / `uiMenusOf(ir)`** (core, new): a package's `react`/`native` routes and menus (`entryOf`),
  with pages per runtime from `componentBeside`. Route keys are `<module>.<stem>`, so two packages' `settings`
  routes never collide.
- **`build-manifest`** (changed): adds `ui` (resources, routes, menus) when any is non-empty; nothing otherwise.
- **`emit-routes`** (changed): `resourceTrees` reads the new entry shape and refuses duplicates; native tables
  register trees too; dependency routes and pages imported from `<package>/<entry>`; `registerMenus(menuTable)`.
  Still returns `[]` for an app with no routes of its own and no contributed ones.
- **`emit-resources`** (core, new): `#stackra/resources` for a panel host, operation refs from `#stackra/clients`.
- **`generate`** (changed): takes `loader?`; calls `readResourceTrees` when the member declares a resource. With no
  loader and a resource present it refuses `resource_loader_missing`, so a manifest never differs by caller.
- **`runGen`** (cli, changed): passes a loader built on Vite `runnerImport` with the legacy decorator transform (the
  `CONSOLE_COMMAND` options).
- **`registerMenus` / `MENU_REGISTRY` / `useMenus`** (`@stackra/navigation` core and react, new; Q2).

## Files and folders

`packages/developer/gen/src/`:

- `node/functions/read-resource-trees.function.ts` (new) and `__tests__/`
- `node/functions/generate.function.ts` (loader option, the read step)
- `node/functions/discover-member.function.ts` only if `ir.resourceTrees` is attached there instead of in `generate`
- `core/types/member-ir.type.ts` (`resourceTrees`), `core/types/module-loader.type.ts` (new)
- `core/functions/resources-of.function.ts`, `ui-routes-of.function.ts`, `ui-menus-of.function.ts`,
  `emit-resources.function.ts` (new) and their `__tests__/`
- `core/functions/build-manifest.function.ts` (the `ui` section), `emit-routes.function.ts`,
  `generate-member.function.ts` (wire `emit-resources`), `core/index.ts`
- `README.md`

`packages/developer/cli/src/node/functions/run-gen.function.ts` (the loader) and its test.

`packages/experience/navigation/src/core/{constants,functions}/` (menu registry) and `react/menu/use-menus.ts` (Q2).

`packages/commerce/loyalty-kit/stackra.manifest.json` (regenerated: its resource is recorded).

`.changeset/sta-1947-gen-ui.md`: `@stackra/gen` minor, `@stackra/cli` minor, `@stackra/navigation` minor,
`@stackra/loyalty-kit` patch.

Docs: the gen output and manifest pages under `apps/docs/src/docs` (exact page found in the docs task).

## Data models and migrations

none

## Contracts

The committed manifest, additive (no format version exists to bump; see the spec's Assumptions):

```jsonc
"ui": {
  "resources": {
    "loyalty_kit.loyalty_account": {
      "module": "loyalty_kit", "class": "LoyaltyAccountResource",
      "from": "@stackra/loyalty-kit/node",
      "options": { "area": "admin", "operations": { "list": "loyalty_kit.loyalty_account.search@1" } },
      "table": { }, "infolist": { }, "actions": [ ]
    }
  },
  "routes": [
    { "key": "orders.list", "module": "orders", "class": "OrdersRoute", "entry": "react",
      "path": "/orders", "pages": { "browser": "Orders" } }
  ],
  "menus": [ { "key": "orders.main", "module": "orders", "class": "MainMenu", "entry": "react", "kind": "navigation" } ]
}
```

Older manifests: a missing `ui` (every manifest on main today) contributes nothing. A `ui.resources` entry is the
tree with `module`, `class` and `from` added, so the three readers that exist today (`emit-routes`,
`client-tools-of`, `check-table-indexes`, all in gen) read it unchanged; a bare tree still reads. A service merges
its hosted packages' `ui.resources` as it merges its other sections, and a host keeps one entry per key when module
and class agree.

Generated files: `#stackra/routes/{browser,native}` gain package routes, `registerMenus(...)` and, on native,
`registerResources(...)`; `#stackra/resources` is new for panel hosts.

New gen error codes: `resource_unloadable`, `builder_impure`, `resource_operation_unknown`, `resource_duplicate`,
`route_duplicate`, `resource_loader_missing`.

## Error handling

Every refusal goes through the existing `GenError` path with `file`, `subject`, `message` and `fix`; a refused run
writes no manifest (today's rule). The cache module under `.stackra/cache/` is overwritten on each run and never read
by anything else.

## Security and tenancy

none: build-time code only; builder members are pure by contract and the loader runs only the member's own source.

## Testing strategy

All on ci-box box 1 (`ci-box run`), never on the Mac.

- Unit, core (IR built by hand, the existing gen test style): `resourcesOf` (AC-001 shape, operation keys, unknown
  operation), `build-manifest` `ui` section present/absent, `emit-routes` with a dependency recording a resource on
  web and native (AC-002), a package route and menu (AC-003), duplicates (AC-005), and an app with no UI dependency
  byte-identical to a snapshot taken from main (AC-004).
- Unit, node: `readResourceTrees` with a fixture resource and a fake loader; an impure builder; a load error.
- Integration: `stackra gen --check` on `packages/commerce/loyalty-kit` and `apps/playground` (playground unchanged).
- Manual (SC-005): `stackra gen --pass manifests` against products/commerce on box 1; count `ui.resources` keys;
  report to the leader; no commit there.

## Rollout

One PR in core, released in the version after `@stackra/*` 0.5.0 (stackra#236). Products pick it up on their next gen
bump; their first gen run records their resources. No flag. If Q1 is answered "gen depends on vite", this PR touches
`pnpm-lock.yaml` and waits its turn for the lockfile.

## Tasks (outline; tasks.md after clarify)

1. Spec, plan, clarify with the leader (Q1–Q3).
2. `MemberIR.resourceTrees`, `ModuleLoader`, `readResourceTrees` + tests (FR-002, FR-004).
3. `resourcesOf` + `ui.resources` in `build-manifest` + tests (FR-001, FR-003).
4. `uiRoutesOf`, `uiMenusOf`, `ui.routes`/`ui.menus` + tests (FR-007, FR-008).
5. `emit-routes`: new entry shape, native registration, dependency routes and menus, duplicates + tests (FR-005,
   FR-006, FR-009–FR-013).
6. Menu registry in `@stackra/navigation` + tests (FR-011, Q2).
7. `emit-resources` + tests (FR-014, Q3).
8. CLI loader in `runGen` + test.
9. Regenerate loyalty-kit; playground `--check` unchanged; docs, README, changeset.
10. Commerce count on box 1 (SC-005); PR; `pnpm linear review`.
