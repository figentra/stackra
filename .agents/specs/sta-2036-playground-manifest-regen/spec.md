# Feature Specification: playground: regenerate the committed manifest and OpenAPI document after the API-area prefix

**Feature Branch**: `figentra/sta-2036-playground-manifest-regen`

**Created**: 2026-11-24

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2036

**Clarifications status**: complete

**Input**: lane L7's first pass found `apps/playground/stackra.manifest.json` and `apps/playground/openapi.json` stale
against gen on main (finding X5). `stackra gen --check` in `apps/playground` printed `stale: ./stackra.manifest.json` and
`stale: ./openapi.json`, and every build regenerated both, so each lane's tree was dirty after a build. Cause: gen
prefixes every derived route with its API area since `d5a7d0a2a` (ADR 0082, 2026-11-09), so `/sessions/end-all` is now
`/app/sessions/end-all` and each action carries `area: app`; the other members' manifests were regenerated then, the
playground's was not. Its wiring section and its route list also changed since the last regeneration.

The Linear key is STA-2036, the issue behind "committed manifests match gen" (the CI step of that name, and the earlier
regenerations #560, #562 and #580). It was chosen from that history by lane L7, which has no Linear access to open a new
issue; the leader confirmed STA-2036 on 2026-11-24.

### Sources

- `stackra gen --check` run in `apps/playground` on `origin/main` 79f0ba8e6: both files stale; on this branch: up to date
- ADR 0082 (public ids and API areas), `d5a7d0a2a` (gen prefixes every route with its area)
- `.github/workflows/ci.yml`, step "Committed manifests match gen" (STA-2036): its glob covers `*stackra.manifest.json`
  and `*src/node/entities.gen.ts`, not `openapi.json`

## Impact

- **Apps touched**: apps/playground (its two generated contract files only; no source file changes)
- **Services touched**: none
- **Packages touched**: none
- **Public contract change**: yes, in the generated files only. Of the 13 actions, 12 have an endpoint: 9 of them gain
  the `/app` prefix (each path is exactly `/app` plus the old path; the other 3 are unchanged, and no HTTP method
  changes) and 10 gain an `area: app` field. The wiring section's driver entries take today's shape, and 2 drivers and 17
  playground routes are added, none removed. No action, event, permission, error or model identity changes and the 12
  OpenAPI operation ids are identical. Nothing in the repository reads either file.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (this repo; the playground renders free components only)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: chore
- **Change risk**: R1 (generated files with no consumer)

## Acceptance criteria

- **AC-001**: THE playground's committed `stackra.manifest.json` and `openapi.json` SHALL equal what `stackra gen` writes for the member on main.
- **AC-002**: WHEN `stackra gen --check` runs in `apps/playground` THE command SHALL report the member up to date.
- **AC-003**: THE regeneration SHALL leave every action, event, permission, error and model identity and every OpenAPI operation id as it was; only endpoint paths, `area` fields and wiring entries change.
- **AC-004**: WHEN `stackra gen` runs again after this change THE tracked files SHALL not change.

## Status history

- 2026-11-24 → Clarified (X5: both files stale against gen since the area prefix landed)
- 2026-11-24 → Planned (plan.md): Approved by leader (Tarek · Stackra Lead) 2026-11-24
- 2026-11-24 → Tasked (tasks.md)
- 2026-11-24 → Implementing (T001 to T003 done; the evidence is in the commit that set this status)
