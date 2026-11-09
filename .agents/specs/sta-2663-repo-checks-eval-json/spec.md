# Feature Specification: a prompt's eval dataset stays .eval.json

**Feature Branch**: `figentra/repo-checks-eval-json`

**Created**: 2026-11-09

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2663

**Clarifications status**: complete

**Input**: `stackra validate --repository` asks every `*.json` not on `MUST_STAY_JSON` to become `.jsonc`, and the list
has no entry for a prompt's evaluation dataset. `@stackra/ai` binds a code prompt's evaluations by the fixed asset name
`<module>::ai/<stem>.eval.json` (`assets/ai/<module>/<stem>.eval.json`), so the file cannot be renamed. Figentra OS's
validate fails on its eval datasets today (RUNWAY).

### Sources

- `packages/developer/repo-checks/src/node/constants/must-stay-json.constant.ts`
- `packages/application/ai/src/core/bases/prompt.base.ts` and `src/core/types/prompt-options.type.ts` (the binding)
- `packages/data/assets` tests (`assets/ai/orders/explain-order.eval.json`)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/repo-checks (one entry and its test)
- **Public contract change**: none; the check accepts one more fixed name
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R0 (a check accepts one more path)

## Acceptance criteria

- **AC-001**: THE JSON config check SHALL accept `assets/ai/**/<stem>.eval.json` in any member.
- **AC-002**: THE check SHALL still flag any other `*.json` under `assets/ai/`.

## Status history

- 2026-11-09 → Clarified (the name is fixed by the prompt binding)
- 2026-11-09 → Planned (plan.md) — Approved by leader 2026-11-09
- 2026-11-09 → Tasked (built in the same branch)
