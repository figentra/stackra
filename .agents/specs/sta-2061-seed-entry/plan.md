# Implementation Plan: the seed entry registers factory partners, hosts package seeders and runs in module order

**Spec**: `.agents/specs/sta-2061-seed-entry/spec.md` · **Linear**: STA-2061 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2061-seed-entry/spec.md`

## Summary

`emitRuntimeEntries` writes the seed entry from the service's own seeders in file order and never registers a factory
pair. The fix reuses what gen already has: the module edges and the topological sort the wiring uses give the module
order; the factory pairs the Vitest setup prints give the pairs; the dependency manifests give the hosted packages.
Two additive manifest sections, `seeders` and `factories`, carry a package's seeders and factory pairs to its host,
which imports them from `<package>/testing`.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); the committed manifests of `packages/commerce/loyalty-kit` and
  `packages/security/access-log` (`tier:lib`), regenerated
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the golden runner `src/node/__tests__/golden.test.ts`
- **Storage**: none
- **Runtime target**: a library (gen, run by the CLI); the generated seed entry runs under `stackra db seed`

## Constitution Check

| Law                                   | Result | Note                                                                         |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen only; the seed entry imports a hosted package's public `./testing` entry |
| Secrets (ADR 0009)                    | PASS   |                                                                              |
| Security                              | PASS   | the `stackra db seed` production guard is the CLI's and does not change      |
| HTTP and events                       | N/A    | no action, query, endpoint or event changes                                  |
| Tenancy                               | N/A    | no table or scope change; seeders run as they do today                       |
| Delegation                            | PASS   |                                                                              |
| Not built yet (ADR 0011)              | PASS   |                                                                              |
| Test placement (ADR 0022)             | PASS   | tests beside their subjects in `core/functions/__tests__/`                   |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                              |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                            |
| Licence tier (ADR 0077)               | PASS   | free                                                                         |
| Docs and ADRs                         | PASS   | the gen README rows; no ADR needed (ADR 0190, 0294, 0305 already decide it)  |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | same: a generated file and manifest content |
| On-prem    | same                                        |
| Air-gapped | same                                        |

## Correctness properties

- **P-001**: For every own factory with a partner, the seed entry holds exactly one `[Factory, Model]` row in its
  `registerModelPartners` call, printed before `runSeedEntry` — Validates: FR-001
- **P-002**: The manifest's `seeders` rows are the member's seeders in module order, and its `factories` rows are its
  partnered factories; members without either get no section — Validates: FR-002, FR-003
- **P-003**: Every seeder and factory a hosted manifest records appears in the host's seed entry, imported from
  `<package>/testing`, with the model imported from the entry exporting its file — Validates: FR-004, FR-005
- **P-004**: For any module edge `a → b` (own or between hosted packages), every seeder of `b` is listed before every
  seeder of `a`; all hosted seeders precede own seeders — Validates: FR-006
- **P-005**: The seed entry exists exactly when the service has a root module, a boot and at least one own or hosted
  seeder — Validates: FR-007
- **P-006**: No two imports of the seed entry bind the same local name — Validates: FR-008
- **P-007**: The wiring of every golden fixture is byte-identical before and after the refactor — Validates: FR-009

## Architecture overview

Discovery already loads the dependency manifests (`ir.dependencies`) and every own class (`ir.classes`, sorted by
file). Gen gains one order function and uses it in three places:

1. `moduleEdges(ir)` (moved out of `emitWiring`) gives each own module the own modules it depends on;
   `topological(keys, edges)` (moved out of `emitWiring`) sorts them.
2. `seedersOf(ir)` lists own seeders in that order, with their derived key and profile. `buildManifest` prints it as
   the `seeders` section, and the seed entry prints it as the own rows.
3. `emitRuntimeEntries`' seed entry walks the non-app dependency manifests in `topological` order over their member
   keys (edges from each manifest's `modules[].dependsOn`), takes their `seeders` and `factories` rows, then appends the
   own rows and own factory pairs.

```
ir.classes ──► moduleEdges ──► topological ──► seedersOf ──► manifest.seeders
                                                     │
ir.dependencies[].manifest.{seeders,factories} ──────┴──► .stackra/entry/seed.ts
ir.classes (factory + partner) ─────────────────────────► registerModelPartners([...])
```

## Components and responsibilities

- `topological` (new file, moved): sorts keys after their dependencies; a cycle keeps source order. Unchanged code.
- `moduleEdges` (new file, moved): the own-module edges, as `emitWiring` computes them today (a dependency on a class of
  another own module, through a `#` import).
- `seedersOf` (new): the own seeder rows in module order, ties by file: `{ key, module, profile, name, file,
importPath }`. The profile is the file stem before `.seeder.ts`, as today.
- `emitWiring`: imports the two moved functions; output unchanged.
- `buildManifest`: adds `seeders` (from `seedersOf`) and `factories` (`{ class, file, model }` for each factory with a
  partner) when non-empty. Touches only these two new sections; the policies section other sessions edit is left as is.
- `emitRuntimeEntries` / `seedEntry`: the hosted rows and pairs, the own pairs, the order, the `Imported<Name>` alias
  on a clash, and the new trigger (own or hosted seeders).

## Files and folders

`packages/developer/gen`:

- `src/core/functions/topological.function.ts` (new, moved from `emit-wiring.function.ts`)
- `src/core/functions/module-edges.function.ts` (new, moved from `emit-wiring.function.ts`)
- `src/core/functions/seeders-of.function.ts` (new)
- `src/core/functions/emit-wiring.function.ts` (imports the moved functions)
- `src/core/functions/build-manifest.function.ts` (`seeders` and `factories` sections)
- `src/core/functions/emit-runtime-entries.function.ts` (the seed entry)
- `src/core/functions/__tests__/topological.function.test.ts`, `seeders-of.function.test.ts` (new)
- `src/core/functions/__tests__/emit-runtime-entries.function.test.ts`, `build-manifest.function.test.ts` (extended)
- `__golden__/service/input/services/shop/src/node/database/factories/order.factory.ts.golden` and
  `__golden__/service/input/services/shop/src/node/database/seeders/demo.seeder.ts.golden` (new), a stand-in
  `__golden__/service/input/_modules/@stackra/database/` when the reader needs it, and the refreshed `expected/` files
  (`.stackra/entry/seed.ts`, `stackra.manifest.json`, `.stackra/vitest.setup.ts`, and whatever else the refresh
  shows)
- `README.md` (the manifest and runtime-entry rows)
- `.changeset/<name>.md` for `@stackra/gen`

`packages/commerce/loyalty-kit/stackra.manifest.json` and `packages/security/access-log/stackra.manifest.json`: only
the new sections, as a fresh gen writes them; their other drift is STA-2036's (spec amendment 1).

## Data models and migrations

none

## Contracts

- `stackra.manifest.json`, additive:
  - `seeders?: { key: string; module: string; profile: string; class: string; file: string }[]`, in module order;
  - `factories?: { class: string; file: string; model: string }[]`.
    Both ride the manifest type's open `[section: string]: unknown`; no type in `@stackra/contracts` changes.
- `.stackra/entry/seed.ts`: gains model and factory imports, a `registerModelPartners([...])` call before `bootApp`,
  hosted seeder imports from `<package>/testing`, and rows in the new order. `runSeedEntry`'s signature is unchanged.

## Error handling

No new refusals. A dependency manifest without the new sections contributes nothing (EC-02). A module cycle keeps
source order and is refused elsewhere (`module_cycle`). A hosted model the manifest's `models` section does not list is
imported from `<package>/node`, the fallback `emitHostedEntities` already uses (EC-07). A wrong import fails the
member's typecheck and build, loudly.

## Security and tenancy

none. The seed entry keeps its direct database connection without the relay, and the CLI's production guard.

## Testing strategy

- AC-001, AC-004, AC-003: `emit-runtime-entries.function.test.ts`, new cases in the "seed entry" block: own pairs;
  module order against path order; a hosted manifest with seeders and factories (imports from `<package>/testing`,
  model from its entry, hosted rows first); two hosted packages with an edge; a hosted-only service (EC-01); an app
  dependency ignored (EC-03); a name clash aliased (EC-04).
- AC-005: `build-manifest.function.test.ts`: the two sections, their order, and their absence for a member without
  seeders or factories; then `stackra gen --check` over the repo on ci-box after regenerating the two package manifests.
- AC-002: the golden `service` fixture with `OrderFactory` and `ShopDemoSeeder`, refreshed with `UPDATE_GOLDEN=1` and
  reviewed by diff: the new `seed.ts`, the manifest sections and the Vitest setup pair; every other fixture's wiring
  unchanged (P-007).
- `topological.function.test.ts` and `seeders-of.function.test.ts`: the moved sort and the own order, ties and cycle.
- Tests carry `@covers sta-2061:FR-###`.

## Rollout

A changeset for `@stackra/gen`. The two package manifests are regenerated in the same pull request so `--check` stays
green. No flag, no migration.

## Delegation and risk plan

One agent, one pull request, gen-only code. Every install, gen, typecheck and test runs on ci-box. Risk: merge
conflicts with the sessions editing `build-manifest.function.ts` (policies) and `emit-registrations`/`emit-boot`;
this change touches only new manifest sections and merges `origin/main` in before shipping.

## ADRs

ADR 0190 (as amended by ADR 0294: profiles, identity `<module>.<profile>`, order by imports), ADR 0294 (decisions 13,
20 and 22), ADR 0305 (rule 5: a factory's partner from its type argument), ADR 0295 (decisions 7 to 9: generated
runtime entries), ADR 0159 (ordering across members is gen's). All Accepted.

## Docs

`packages/developer/gen/README.md`: the `stackra.manifest.json` row names the `seeders` and `factories` sections; the
`.stackra/entry/*.ts` row names a service's `seed` entry with its factory pairs and hosted seeders.

## Complexity tracking

none
