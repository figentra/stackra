# A package's entity list is a committed generated contract

**Linear**: STA-1874
**Status**: clarified
**Clarifications status**: complete

## Problem

STA-1793 (36dbd49e) made eleven packages re-export their entity list from `./node`, so a hosting service's generated
`registrations.ts` can register the package's entities: achievements, ai, rules, segments, loyalty-kit, webhooks, content,
collaboration, panel, workflow and access-log. Each stand-in barrel does
`export { <KEY>_ENTITIES } from "#stackra/entities/<key>"`, a file gen writes into the gitignored `.stackra/gen/`.

That makes a package's built `./node` depend on gen output, and the build order cannot provide it:

1. `//#gen:workspace` runs the built `stackra` CLI, so it waits for `@stackra/cli#build`, and "build never waits for gen"
   keeps that closure acyclic (turbo.jsonc). ai, rules, content and workflow are inside the CLI's 60-package
   dependency closure: their build always runs before gen, so their dist can never inline the generated list. Making
   their build wait for gen is a cycle (gen needs the CLI, the CLI needs them built).
2. The other seven build in parallel with gen. access-log's build won the race, so its `dist/node.mjs` kept
   `#stackra/entities/access_log` as a runtime import. gen then loads access-log's own `./node` for its migration macro
   (`t.dataClassification`, STA-1689) and fails with `migration_load_failed`, and panel and loyalty-kit, which use that
   macro, fail with it (#200's Quality Gate).
3. A runtime import of a generated file cannot work from a dist at all: `.stackra/` is gitignored and not shipped, and
   Node resolves the imports map's first target (`./.stackra/gen/*`, no extension) without falling back on a missing
   file. The entity list must be inside the dist, so it must exist before the build.

## Decision

The leader decided option E on 2026-11-01: a package's entity list is a committed generated contract, written by gen
and kept fresh by `stackra gen --check`, with `stackra.manifest.json` as the precedent. The build never needs gen for
it, for all eleven packages, with no cycle. Options A (an entities pass before the build), B (a separate entry) and
C/D (per-package reverts or a loader hook) were weighed; A cycles for the four packages in the CLI closure, B needs a
new entry outside ADR 0294 decision 15 and still waits for gen, and C/D fix gen but leave the dists broken.

## Change

1. **gen** writes a package's (`layout: "package"`) entity file to `src/node/entities.gen.ts` instead of
   `.stackra/gen/entities/<key>.ts`, with the same content (it imports only the package's own models through `#node/…`
   and `@stackra/database`, never `.stackra/`). It is committed, so `gen --check` reports it stale or missing like the
   manifest (`COMMITTED` in `generate.function.ts`). Services and apps keep `.stackra/gen/entities/` unchanged.
2. **Every package with models commits its list**: fourteen, the eleven above plus data-maintenance, scope and
   settings. The thirteen stand-in barrels (all but data-maintenance, whose entries gen writes) re-export
   `<KEY>_ENTITIES` from `#node/entities.gen`. The first files were written by gen's own `discoverMember` and
   `generateMember` on testbed box 1 (a one-time bootstrap: `generate` would refuse access-log while its built `./node`
   still imports `.stackra/`), never by hand. A package whose models span two modules is refused
   (`package_entities_modules`), since one committed file holds one module's list; a module with only model additions
   (ADR 0336) counts, because gen writes an entity file for it too. None does today.
3. **The committed lists are generated, so the house checks skip them**: oxfmt's and oxlint's ignore lists and the doc
   standard's scope (`*.gen.ts`), as `encore gen client` output already is; `gen --check` compares them byte for byte.
4. **The validator** (`packageEntitiesFindings`, STA-1793) expects that re-export from `#node/entities.gen`.
5. **ADR amendments**, dated 2026-11-01, with the cycle analysis above: ADR 0294 rule R10 lists a package's
   `src/node/entities.gen.ts` among the committed generated contracts; ADR 0295 records that the build of the CLI's
   dependency closure precedes gen (an exception to "gen runs before any build"), so nothing a package's dist imports
   may live only in `.stackra/`. Reviewed by the architecture-guardian and docs-adr-steward agents.

## Release note

The published 0.3.0 `dist/node.mjs` of the affected packages carry the broken `#stackra/entities/*` runtime import; they
stay broken until the next release ships builds of these committed lists.

## Acceptance

- `stackra gen` writes no package entity file under `.stackra/gen/entities/`, and `gen --check` fails when a package's
  `src/node/entities.gen.ts` is stale or missing.
- No package source imports `#stackra/entities/`.
- `gen:workspace` no longer refuses access-log, panel or loyalty-kit with `migration_load_failed`.

## Impact

- **Apps touched**: none
- **Services touched**: none (their `.stackra/gen/entities/` stays)
- **Packages touched**: @stackra/gen, @stackra/cli (validator), and the eleven packages' barrels and committed lists
- **Cross-service events**: none
- **Tenancy and data**: none; the entity schemas are unchanged, only where they are written
- **Secrets**: none
- **ADR needed**: yes; amendments to ADR 0294 (R10) and ADR 0295, in this PR
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: ADR 0294, ADR 0295, the gen and cli READMEs
- **Lane**: full
- **Change risk**: R2
