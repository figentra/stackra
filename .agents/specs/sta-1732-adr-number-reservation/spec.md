# Feature Specification: ADR number reservation

**Feature Branch**: `figentra/sta-1732-adr-number-reservation`

**Created**: 2026-10-31

**Status**: Implementing <!-- owner approved the task through the leader, 2026-10-31 -->

**Linear**: STA-1732

**Clarifications status**: complete

**Input**: The owner's task (2026-10-31, through the leader): three sessions each claimed ADR 0503 and another nearly
took 0501, because numbers were picked from local branches. Reserve numbers on main before an ADR is written.

## Impact

- **Apps touched**: `apps/docs` (new `adr/numbers.yaml`, outside `src/docs`, which holds pages only)
- **Services touched**: none
- **Packages touched**: `packages/developer/repo-checks` (the `adr-numbers` rule in the config phase)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: the reserve script mints the bot token like `pr-merge.mjs` (`infisical run` in its pnpm script); no value is printed or written
- **ADR needed**: no (a process tool; the docs-adr skill and steward state the rule)
- **New dependencies**: none (`yaml` is already in the root and repo-checks)
- **Deploy modes**: repository tooling only
- **Licence tier**: free (internal tooling)
- **Docs to update**: AGENTS.md, the docs-adr skill, the docs-adr-steward agent, the prompt hint
- **Lane**: lite
- **Change risk**: R1 (repository tooling; a new validate rule)

## Requirements

- **FR-001** `apps/docs/adr/numbers.yaml`: number → `slug`, `status` (reserved, proposed, accepted,
  superseded, deferred), and for a reservation `owner` and `issue`. Seeded with every ADR on main and today's 0501 to
  0506, each checked against the branches.
- **FR-002** `pnpm adr:reserve <slug> --issue STA-n [--owner <who>]`: reads `numbers.yaml` from GitHub's main, takes
  the highest number plus one, commits the entry on a new branch through the API and opens a one-line PR. The first
  PR to land wins; a loser's PR conflicts, and it reserves again.
- **FR-003** `stackra check` config phase, rule `adr-numbers`: every `NNNN-<slug>.mdx` has its number registered with
  the same slug; no number is used by two files or registered twice.
- **FR-004** AGENTS.md: reserve before writing an ADR.

## Not built here

- A `stackra adr reserve` CLI command: the script lives in `tools/scripts` until the ADR 0500 CLI moves land.
- Statuses are not cross-checked against each page's `description`.
