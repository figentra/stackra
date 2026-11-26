# Feature Specification: gen writes a service's Encore folder outside the .stackra dot folder

**Feature Branch**: `figentra/sta-2667-encore-folder`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2667

**Clarifications status**: complete

**Input**: P0-1 of the 0.33.1 Encore build list. Encore skips dot directories when it discovers services, so the
services gen writes into `.stackra/encore/<member>/` are never found: RUNWAY's `encore build docker` of Pay made an app
with only the api-gateway. RUNWAY's run 7 (pay#217 @ 6aeffa2d) copied only `.stackra/encore` to a plain folder: Encore
found and parsed the service there and followed its imports into `.stackra/entry` and `.stackra/gen`. So only the
service folders move; the entry and gen output stay in `.stackra`.

### Sources

- RUNWAY's spike runs 6 and 7 (2026-11-10)
- `packages/developer/gen/src/core/functions/emit-encore-*.function.ts`, `encore-app-import.constant.ts`
- `packages/developer/gen/src/node/functions/generate.function.ts` (the Encore migrations copy)
- `packages/developer/cli/src/node/functions/resolve-tool.function.ts` (`stackra dev` for a service)
- ADR 0091 (decision 2 as amended 2026-11-09: the app root is the member root)

## Impact

- **Apps touched**: none
- **Services touched**: none (their generated Encore folder moves on the next gen; `.gitignore` covers it)
- **Packages touched**: gen (the folder constant, every Encore emitter, the migrations copy, golden files), cli
  (`stackra dev` for a service), database and runway (message text)
- **Public contract change**: gen exports `ENCORE_SERVICES_DIR`; the generated Encore folder moves to
  `stackra-encore/<member>/`
- **Cross-service events**: none; topic names and subscriptions are unchanged, only their import paths
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0091 decision 2 is amended in place)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0091
- **Lane**: full
- **Change risk**: R2 (moves generated output every service's Encore build reads)

## Acceptance criteria

- **AC-001**: THE generator SHALL write a service's Encore files into `stackra-encore/<member>/` at the member root,
  never under `.stackra/`.
- **AC-002**: THE generated Encore files SHALL import the server entry from `../../.stackra/entry/server` and a sibling
  service's topics from `../../../<folder>/stackra-encore/<member>/events`.
- **AC-003**: WHEN `stackra dev` serves a service THE CLI SHALL run `encore run` in the member root and refuse when
  gen has not written `stackra-encore/`.
- **AC-004**: THE repository SHALL ignore `stackra-encore/` in git, except gen's golden trees.

## Status history

- 2026-11-10 → Clarified (RUNWAY run 7: Encore follows imports into a dot folder; only discovery skips it)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (`stackra-encore/`)
- 2026-11-10 → Tasked (tasks.md; built in the same branch, stacked on STA-2666)
