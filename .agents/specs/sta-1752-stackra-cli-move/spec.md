# Refactor Specification: the 16 stackra rows of ADR 0500 move into @stackra/cli

**Feature Branch**: `figentra/sta-1752-stackra-cli-move-the-16-toolsscripts-rows-of-adr-0500`

**Created**: 2026-11-01

**Status**: Implementing

**Linear**: STA-1752

**Clarifications status**: complete

**Input**: ADR 0500 decision 4 (accepted 2026-10-31; owner approval of the four CLIs and the script map). The leader
assigned STA-1752 on 2026-11-01: bring the wave 1 commit `ae232122` ("move the tools/scripts repository commands into
stackra", dated 2026-10-31) up to core main `3fa57cd6`, porting every main change to the moved scripts. The console
Command kind (STA-1730) comes later; the commands keep the CLI's `CliCommand` shape.

## Impact

- **Apps touched**: `apps/docs` (pages and AGENTS.md that name the moved scripts; generated structure page and architecture map)
- **Services touched**: none
- **Packages touched**: `packages/developer/cli` (the new commands and their tests), docs-only mentions in `repo-checks`, `coding-standard`, `skills`, `tenancy`, `support`, `icons`
- **Cross-service events**: none
- **Tenancy and data**: none at runtime; the session-setting check of ADR 0495 moves with its two rules unchanged
- **Secrets**: none
- **ADR needed**: no (ADR 0500 decisions 4, 6 and 7)
- **New dependencies**: none
- **Deploy modes**: repository tooling only
- **Licence tier**: free (`@stackra/cli`, MIT)
- **Docs to update**: `tools/scripts/README.md`, `packages/developer/cli/README.md`, `AGENTS.md` and its rule sources, the docs pages that name the scripts
- **Lane**: refactor
- **Change risk**: R2 (the repository gate moves; its checks and output stay the same)

## Requirements

- **FR-001** Each of the 16 `stackra` rows of ADR 0500 decision 4 is a `stackra` command or a module of `stackra validate`, and `tools/scripts` keeps no copy of it.
- **FR-002** Each moved command keeps its behaviour, flags, exit codes, stdout and stderr (decision 7); its tests move beside it in `@stackra/cli` as vitest.
- **FR-003** `stackra validate --repository` runs every check `validate-repository.mjs` ran on main `3fa57cd6`, including the Python placement check (STA-1637) and the session-setting check (ADR 0495, STA-1699), and prints the findings as before.
- **FR-004** The root `package.json` scripts keep their names (`validate`, `new`, `doctor`, `eas:preflight`) and call the CLI; the baselines (`any-ratchet.baseline.yaml`, `duplication-baseline.yaml`) stay in `tools/scripts`.
- **FR-005** Every caller and mention of a moved script (scripts, turbo, workflows, lefthook, docs, rules, AGENTS.md) names the command instead; `.agents/hooks` changes only with the leader's sign-off.
- **FR-006** `stackra testbed` and every other command main added since `ae232122`'s parent stays registered.

## Status history

- 2026-11-01 → Clarified (leader assignment; ADR 0500 accepted 2026-10-31)
- 2026-11-01 → Planned
- 2026-11-01 → Tasked
- 2026-11-01 → Implementing
