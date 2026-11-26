# Feature Specification: cli: stackra upgrade moves a consumer between releases, with codemods and a release gate

**Feature Branch**: `figentra/sta-145-stackra-upgrade`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (pending)

**Linear**: STA-145

**Clarifications status**: complete

**Input**: ADR 0199 decision 2 promises `stackra upgrade`, but every breaking `@stackra/*` minor has been a manual
migration in each consumer repository. The command moves a consumer workspace from the `@stackra/*` version it pins to a
target release, prints the upgrade note of every release in between, rewrites what a codemod can rewrite, reports what
only a person can port, and runs the install and generate steps. Review round 1 blocked on missing entries for the
breaking releases (0.8.0, 0.19.0, 0.27.0, 0.29.0, 0.30.0), a wrong "no breaking release in between" line, a runbook and
ADR claim that every break has a codemod with nothing enforcing it, a re-run after a failed step that skipped steps, and
a namespace rename applied before the named-import rename.

### Sources

- ADR 0199 (decision 2 and Enforcement), ADR 0013 (decision 5), ADR 0282 (decision 3)
- every `@stackra/*` `CHANGELOG.md` from 0.4.0 to 0.33.1 and the pending `.changeset/*.md`
- the readiness audit, batch 8 item 8.1 (2026-11-26)

## Impact

- **Apps touched**: `apps/docs` (CLI page in English and Arabic, the upgrade runbook, ADR 0199 Enforcement)
- **Services touched**: none
- **Packages touched**: `@stackra/cli` (new `upgrade` and `upgrade-notes` commands, `UPGRADE_CODEMODS`)
- **Public contract change**: two new CLI commands in `packages/developer/cli/stackra.manifest.json`; `pnpm validate`
  runs `stackra upgrade-notes`
- **Cross-service events**: none
- **Tenancy and data**: none (a consumer's source and pin files only)
- **Security and privacy**: none (no network beyond the `pnpm install` the consumer already runs)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0199 decision 2 and its Enforcement)
- **New dependencies**: `@ast-grep/napi`, `ts-morph` (loaded only when a source codemod runs)
- **Deploy modes**: same in all three (a developer tool)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (terminal output and `--json`)
- **Docs to update**: `apps/docs/src/docs/cli.mdx`, `apps/docs/src/docs/cli.ar.mdx`,
  `apps/docs/src/docs/runbooks/upgrade.mdx`, ADR 0199 Enforcement, `packages/developer/cli/README.md`,
  `packages/developer/cli/AGENTS.md`
- **Lane**: full
- **Change risk**: R2 (a new developer command that edits a consumer's files, and a new repository gate)

## Acceptance criteria

- **AC-001**: WHEN a consumer runs `stackra upgrade` THE command SHALL move every exact `@stackra/*` pin in
  `pnpm-workspace.yaml` and each member's `package.json` to the target, keeping prefix and layout, and SHALL leave
  `workspace:`, `catalog:`, ranges and `@stackra-pro/*` alone.
- **AC-002**: WHEN releases with an upgrade entry lie between the pinned version and the target THE command SHALL print
  each entry's note, oldest first, AND SHALL run each entry's codemods over the consumer's source; WHEN none does it
  SHALL say only the versions move (never "no breaking release").
- **AC-003**: THE ts-morph rename codemods SHALL rewrite imports and re-exports of a moved or renamed export, rename a
  named import before a namespace use in the same file, and never alias the import because of a member name.
- **AC-004**: THE ast-grep report codemods SHALL list the code only a person can port as `file:line:column` findings.
- **AC-005**: `--dry-run` SHALL print the plan, the notes and every diff and write nothing.
- **AC-006**: THE command SHALL refuse a dirty working tree, an inexact version and a pin newer than the target (exit 2).
- **AC-007**: WHEN a command step fails THE command SHALL exit 1, run nothing after it, and name the re-run
  (`--from <old> --to <new> --allow-dirty`); THE re-run SHALL install again and finish every step.
- **AC-008**: `UPGRADE_CODEMODS` SHALL have an entry for every `@stackra/*` release from 0.4.0 to 0.33.1 whose changelog
  asks a consumer to act.
- **AC-009**: `stackra upgrade-notes`, run by `pnpm validate`, SHALL fail when a pending `@stackra/*` changeset or a
  released `@stackra/*` changelog entry carries a break mark and has no upgrade entry, or names an entry that does not
  exist.

## Status history

- 2026-11-26 → Clarified (ADR 0199 decision 2; review round 1 findings)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (commits 379f52d90 and the review round 2 commit on `figentra/sta-145-stackra-upgrade`)
