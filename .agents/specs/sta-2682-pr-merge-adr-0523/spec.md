# Feature Specification: pr-merge: the gate and the ruleset are the merge condition (ADR 0523)

**Feature Branch**: `figentra/sta-2682-pr-merge-adr-0523`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: owner (decision of 2026-11-10, relayed by the leader)

**Linear**: STA-2682

**Clarifications status**: complete

**Input**: the owner's yes of 2026-11-10 to align `pnpm pr:merge` with ADR 0523 decision 3 ("a bot merges, by the
gate", honouring a HOLD label) and decision 6 (the stackra-reviewer App is retired; AI review is advisory). Today
`pr:merge` still refuses without an `AI-REVIEW: PASS` from the retired App, so no PR can merge through it.

### Sources

- `tools/scripts/pr-merge.mjs`, `tools/scripts/__tests__/pr-merge.test.mjs`
- `tools/scripts/bot-gh.mjs` (the retired `review` mode's message), `tools/scripts/README.md`
- ADR 0119 (decision 2), ADR 0523 (decisions 3 and 6)

## Clarifications

- **Session 2026-11-10 (leader, owner's yes)**: the condition is open and not draft, the head's latest Quality Gate
  run green, the ruleset letting it merge (`mergeStateStatus` CLEAN or the queue path) and no `hold` label. The
  AI-REVIEW requirement goes; `--admin` stays refused. `UNSTABLE` also counts as the ruleset letting it merge: only a
  non-required check is not green then, and the required gate is its own condition. The design and risk:R3 owner
  approval of ADR 0119 decision 2 (as amended 2026-10-28) is kept; the leader confirms or drops it in review.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none (repository scripts in `tools/scripts`)
- **Public contract change**: `pnpm pr:merge`'s refusal reasons
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: the merge condition; `--admin` is never used and the gate stays required
- **Secrets**: none
- **ADR needed**: yes, an amendment note on ADR 0119
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: ADR 0119, `tools/scripts/README.md`
- **Lane**: full
- **Change risk**: R2 (the merge condition)

## Acceptance criteria

- **AC-001**: WHEN the PR is closed, merged or a draft THE script SHALL refuse.
- **AC-002**: WHEN the newest Quality Gate run on the head is missing or not `success` THE script SHALL refuse.
- **AC-003**: WHEN the base has no merge queue and `mergeStateStatus` is not CLEAN, HAS_HOOKS or UNSTABLE THE script
  SHALL refuse, naming the state and its fix.
- **AC-004**: WHEN the PR carries a `hold` label in any case THE script SHALL refuse.
- **AC-005**: THE script SHALL NOT read or require an AI-REVIEW verdict, and SHALL never pass `--admin`.
- **AC-006**: WHEN a PR is labelled `design` or `risk:R3` THE script SHALL refuse without the owner's approval on the
  head or the owner-added `owner-approved` label.

## Status history

- 2026-11-10 → Clarified (owner's yes via the leader)
- 2026-11-10 → Planned (plan.md) — Approved by owner 2026-11-10
- 2026-11-10 → Tasked (tasks.md)
