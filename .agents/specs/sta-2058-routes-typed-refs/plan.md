# Implementation Plan: bare `#stackra/routes`, derived route titles and the list permission on resource routes

**Spec**: `.agents/specs/sta-2058-routes-typed-refs/spec.md` · **Linear**: STA-2058 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2058-routes-typed-refs/spec.md`

## Summary

`emitRoutes` writes one more file, `.stackra/gen/routes.ts` (`#stackra/routes`): `Routes` (one `routeRef` per route
key, the class a type argument) and `RouteKey`. A new `routeTitleKey(module, file)` derives
`<module>::routes.<snake(stem)>.title`; the runtime route tables carry it as `title` for a route that writes none, a
package's `ui.routes` entry records it, and `@stackra/navigation`'s `registerRoutes` keeps it so `resolveMenuItems`
labels an entry with it before the raw key. `emitResources` passes the bound list action's recorded `permission` into
`resource(...)`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); `packages/experience/navigation` (`tier:lib`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the gen golden runner (`src/node/__tests__/golden.test.ts`)
- **Storage**: none
- **Runtime target**: a library (gen's build-time emitters; navigation's isomorphic route registry)

## Constitution Check

| Law                                   | Result | Note                                                                       |
| ------------------------------------- | ------ | -------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen emits text naming `@stackra/navigation`; it imports no navigation code |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                 |
| Security                              | PASS   | the list permission only hides navigation; the server still enforces it    |
| HTTP and events                       | N/A    | no endpoint or event changes                                               |
| Tenancy                               | N/A    | no tenant data                                                             |
| Delegation                            | PASS   | one session, one worktree                                                  |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                     |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                                  |
| Versions and catalogs                 | PASS   | no dependency added; `pnpm-lock.yaml` unchanged                            |
| Deploy modes (ADR 0076)               | PASS   | build-time output, same in all three                                       |
| Licence tier (ADR 0077)               | PASS   | free                                                                       |
| Docs and ADRs                         | PASS   | READMEs of both packages; no ADR change                                    |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | same generated files; no runtime difference |
| On-prem    | same                                        |
| Air-gapped | same                                        |

## Correctness properties

- **P-001**: for every app with routes, the keys of `Routes` in `routes.ts` equal the union of the keys of every
  runtime table, each once, and every class is imported with `import type` — Validates: FR-001
- **P-002**: `routeTitleKey(m, "src/routes/<stem>/<stem>.route.ts")` is `m::routes.<snake(stem)>.title` — Validates:
  FR-002
- **P-003**: a row carries `title` exactly when its route writes no `title` option (own) or its manifest entry records
  one (composed) — Validates: FR-003, FR-004
- **P-004**: `registerRoutes` records titles all or nothing; a menu label is the class title, else the registered
  title, else the key — Validates: FR-005
- **P-005**: a `resource(...)` call carries `permission` exactly when its list binds a recorded action, and it is that
  action's `permission` — Validates: FR-006

## Architecture overview

Gen reads the app IR (own `route` classes) and the dependency manifests (`ui.routes` through `hostRoutesOf`). The same
loop that writes each runtime table also collects every key with its type import into one runtime-free bare module.
The navigation package is the only runtime reader: `registerRoutes(routeTable)` already runs at boot from the runtime
table, so the derived title rides along with no new call.

## Components and responsibilities

- `routeTitleKey` (new, gen): the derived title key of one route.
- `emitRoutes` (gen): adds `title` to rows, and returns `routes.ts` after the runtime tables.
- `uiRoutesOf` (gen): records `title` on a package route that writes none.
- `hostRoutesOf` (gen): its `UiEntry` type gains the optional `title` it passes through.
- `emitResources` (gen): its refs map keeps each action's `permission`; a bound list adds it to the call.
- `registerRoutes`, `ROUTE_TITLE_TABLE` (new), `resolveMenuItems` (navigation): keep and read the derived title.

## Files and folders

- `packages/developer/gen/src/core/functions/route-title-key.function.ts` (new) and its test
  `__tests__/route-title-key.function.test.ts` (the brief named `route-key.function.ts`; one declaration per file puts
  the new function in its own file, and `route-key.function.test.ts` stays as is)
- `packages/developer/gen/src/core/functions/emit-routes.function.ts` and `__tests__/emit-routes.function.test.ts`
- `packages/developer/gen/src/core/functions/ui-routes-of.function.ts` and `__tests__/ui-routes-of.function.test.ts`
- `packages/developer/gen/src/core/functions/host-routes-of.function.ts`
- `packages/developer/gen/src/core/functions/emit-resources.function.ts` and `__tests__/emit-resources.function.test.ts`
- `packages/developer/gen/__golden__/app-clients/` (the web app gains a route, its page and an authored
  `#stackra/routes` import; a `@stackra/navigation` stub under `input/_modules/`; expected output refreshed with
  `UPDATE_GOLDEN=1` and reviewed) and the fixture table in `__golden__/README.md`
- `packages/experience/navigation/src/core/constants/route-title-table.constant.ts` (new)
- `packages/experience/navigation/src/core/functions/register-routes.function.ts`,
  `resolve-menu-items.function.ts` and their tests
- `packages/developer/gen/README.md`, `packages/experience/navigation/README.md`

## Data models and migrations

none

## Contracts

- `#stackra/routes` (generated): `export const Routes = { <key>: routeRef<typeof <Class>>("<key>"), ... } as const;`
  and `export type RouteKey = keyof typeof Routes;`
- `registerRoutes` table entry: `{ route, page?, title? }` (additive).
- Manifest `ui.routes[]`: optional `title` (additive).
- Generated `resource(key, { base, permission?, list?, view?, create?, update? })`: `permission` added when known.

## Error handling

No new refusal. A route key that is not snake_case already throws in `routeRef` and `registerRoutes`; the bare module
uses the same keys as the tables, so it adds no failure mode. `registerRoutes` validates the whole batch before writing
either table, so a bad entry leaves no title behind.

## Security and tenancy

The list permission is read from the producer's committed manifest, never from the client; it only hides a navigation
entry (ADR 0307 rule 4) and the server enforces it on the call. No tenant data, no personal data.

## Testing strategy

- AC-001: `emit-routes.function.test.ts` (bare file, keys, type imports, composed routes, no file for a non-app or a
  routeless app) and the `app-clients` golden fixture's expected `.stackra/gen/routes.ts`.
- AC-002: `route-title-key.function.test.ts`; `emit-routes.function.test.ts` (row `title` only for untitled routes,
  composed `title` passed through); `ui-routes-of.function.test.ts`; navigation's `register-routes.function.test.ts`
  and `resolve-menu-items.function.test.ts`.
- AC-003: `emit-resources.function.test.ts` (bound list carries the permission; unbound list carries none).
- All runs on ci-box: gen and navigation `test`, `typecheck`, `lint`, then `pnpm verify` for the two packages.

## Rollout

none. Generated output changes on the next `stackra gen`; the `.stackra/` folder is gitignored, so no app commit.

## Delegation and risk plan

One session in worktree `.claude/worktrees/sta-2058`. Every build, gen, typecheck and test runs on ci-box. Before
shipping, merge `origin/main` in (STA-2044, STA-2045, STA-2046 and STA-2047 edit neighbouring gen files) and keep their
behaviour. Budget: small (one PR).

## ADRs

ADR 0294 decision 20 (route identity, i18n default keys), ADR 0322 decision 1 (typed keys), ADR 0307 rule 4 (list
permission gates navigation), ADR 0111 decisions 3 and 4 (composed routes): all Accepted.

## Docs

`packages/developer/gen/README.md`; `packages/experience/navigation/README.md`.

## Complexity tracking

none
