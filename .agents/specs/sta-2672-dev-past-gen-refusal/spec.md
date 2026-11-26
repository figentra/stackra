# Feature Specification: stackra dev serves on when gen refuses one member

**Feature Branch**: `figentra/sta-2672-dev-past-gen-refusal`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2672

**Clarifications status**: complete

**Input**: STA-2664 item 13 (a), from the OS lane's local run (STA-2670). `stackra dev --surface` and
`stackra dev --product` stop with exit 1 whenever `stackra gen` exits non-zero, so one member's refusal stops every
surface, even when the refused member is not part of it. `stackra gen` already runs every member after one fails,
writes what it can, and exits 1 when one refuses.

### Sources

- `packages/developer/cli/src/node/dev-surface/functions/run-dev-surface.function.ts`
- `packages/developer/cli/src/node/dev-product/functions/run-dev-product.function.ts`
- `packages/developer/cli/src/node/constants/gen-command.constant.ts` (exit 1 on refusals; every member runs)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/cli (the dev surface and product runs, a helper, tests)
- **Public contract change**: `stackra dev` exits 0 past a gen refusal and names it on stderr
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
- **Change risk**: R1 (a local dev command only; `stackra build` and `gen --check` still stop on a refusal)

## Acceptance criteria

- **AC-001**: WHEN `stackra gen` exits 1 (a member refused) THE dev run SHALL write that gen refused a member to
  stderr and go on to start its surfaces and apps.
- **AC-002**: WHEN `stackra gen` exits with any other non-zero code THE dev run SHALL stop with exit 1, as before.

## Status history

- 2026-11-10 → Clarified (gen already writes every other member; only dev stops on its exit code)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (STA-2664, first with item 12)
- 2026-11-10 → Tasked (tasks.md; built in the same branch)
