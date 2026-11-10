# Feature Specification: a service's tsconfig paths give Encore one `./` target per key, and its typecheck reads no paths

**Feature Branch**: `figentra/sta-2681-encore-paths`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2681

**Clarifications status**: complete

**Input**: STA-2664 item 19 and the queued item d (0.33.1 item 6). Two faults in one rule, ADR 0091's 2026-11-09
amendment, rule 4 ("paths equal to package.json imports"):

1. Encore honours only the first `./` target of a tsconfig `paths` key and ignores `extends`. The OS lane's identity
   app parses only with a single-target `./`-prefixed mirror; the four-target arrays that copy `imports` do not
   resolve for it.
2. tsconfig `paths` are program-wide. A service that compiles a workspace package with the same `#` subpaths resolves
   that package's `#stackra/*` through the service's own paths (notify#71: TS2305 in chatwoot's
   `.stackra/entry/node.ts`), so the check and the typecheck cannot both pass.

### Sources

- `packages/developer/repo-checks/src/node/functions/paths-of-imports.function.ts`, `check-encore-service.function.ts`
- `packages/developer/cli/src/node/encore/functions/prepare-encore-service.function.ts`
- `packages/developer/cli/src/node/functions/resolve-tool.function.ts` (the `typecheck` run)
- `packages/developer/gen/src/core/functions/emit-tool-configs.function.ts`
- `packages/tooling/typescript/src/base.json` (`moduleResolution: bundler`: a path target probes extensions and
  `index` files, and `#` imports resolve through each package's own `package.json`)
- FLOW-CI's report (notify#71, run 42697088618); the OS lane's local run (identity)

## Impact

- **Apps touched**: none
- **Services touched**: services/example, services/health (their tsconfig `paths`)
- **Packages touched**: packages/developer/repo-checks, packages/developer/cli, packages/developer/gen
- **Public contract change**: a service's tsconfig `paths` hold one target per key; gen writes
  `.stackra/tsconfig.typecheck.json` for a service
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: yes, a correction of ADR 0091's 2026-11-09 amendment, rule 4
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0091
- **Lane**: full
- **Change risk**: R2 (how every service's code resolves, for Encore and for the typecheck)

## Acceptance criteria

- **AC-001**: THE `paths` that `stackra encore:prepare` writes and `stackra validate --repository` expects SHALL hold,
  for each package.json `imports` key, that entry's first target only.
- **AC-002**: WHEN gen runs for a service THE output SHALL include `.stackra/tsconfig.typecheck.json`, which extends
  the member's tsconfig and sets no `paths`.
- **AC-003**: WHEN a service's typecheck runs with gen's typecheck config present THE run SHALL use that config:
  `tsc --noEmit -p .stackra/tsconfig.typecheck.json`, so each package's `#` imports resolve through its own
  package.json.
- **AC-004**: THE committed services SHALL carry the one-target `paths`.

## Status history

- 2026-11-10 → Clarified (the OS lane's single-target finding; FLOW-CI's program-wide paths finding)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (0.33.1 item 6)
- 2026-11-10 → Tasked (tasks.md)
