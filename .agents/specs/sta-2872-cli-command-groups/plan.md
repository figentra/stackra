# Implementation Plan: the stackra command list is grouped and short, with the core-repository checks hidden

**Spec**: `.agents/specs/sta-2872-cli-command-groups/spec.md` · **Linear**: STA-2872 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2872-cli-command-groups/spec.md`

## Summary

`@stackra/console` learns three things: a heading order (`ConsoleConfig.groups`), a per-run test that leaves commands
out of the list and completion (`ConsoleConfig.unlisted`), and the built-in `list [--all]`. The renderer's
`commandList` takes `CommandListOptions` (`order`, `more`) so the list can end with the `list --all` hint. `@stackra/cli`
gives every command a `group` from `COMMAND_GROUPS`, hides the check presets and the plumbing commands, and passes
`unlistedCommand(cwd)`: outside the core repository the Repository group is left out, and `COMMAND_FITS` commands are
left out where the workspace lacks their fit (read once, lazily, through `readDoctorWorkspace`).

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `@stackra/console` (developer), `@stackra/cli` (developer)
- **Testing**: vitest in `src/**/__tests__/`; CLI tests write fixture workspaces to a temp folder
- **Storage**: none
- **Runtime target**: the `stackra` binary on a developer machine and in CI

## Constitution Check

| Law                                   | Result | Note                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI depends on the console, as before; no new edge                    |
| Secrets (ADR 0009)                    | N/A    | none                                                                      |
| Security                              | PASS   | reads only the workspace's manifests and root runway when listing         |
| HTTP and events                       | N/A    | none                                                                      |
| Tenancy                               | N/A    | none                                                                      |
| Delegation                            | PASS   | Claude only                                                               |
| Not built yet (ADR 0011)              | PASS   | nothing referenced that is not built                                      |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                     |
| Versions and catalogs                 | PASS   | a changeset bumps `@stackra/console` and `@stackra/cli` (minor, additive) |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                         |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                 |
| Docs and ADRs                         | PASS   | README section, CLI docs page (English and Arabic); no ADR change         |

## Deploy modes

| Mode       | Behaviour                                       |
| ---------- | ----------------------------------------------- |
| SaaS       | the developer's `stackra` lists the grouped set |
| On-prem    | the developer's `stackra` lists the grouped set |
| Air-gapped | the same; the list reads only local files       |

## Correctness properties

- **P-001**: headings are drawn ungrouped first, then `groups` in order, then alphabetically — Validates: FR-001, AC-002
- **P-002**: an unlisted command is out of the list, `--json` and completion, and runs by name — Validates: FR-002, AC-004
- **P-003**: `list` is the bare list, `list --all` holds every command, other `list` forms exit 2 — Validates: FR-003, AC-003
- **P-004**: the minimal app lists exactly its 25 commands under the groups in order — Validates: FR-002, AC-001, AC-002
- **P-005**: the core repository lists Repository; a workspace's fits bring their commands — Validates: FR-002, AC-005
- **P-006**: every command names a group of `COMMAND_GROUPS`; the Repository and hidden sets are pinned — Validates: FR-001, AC-006
- **P-007**: `list --all --json` keeps each command's real `hidden` value while the text draws every row — Validates: FR-003, AC-007
- **P-008**: with a mobile app `eas-preflight` (Deploy) and `app-native-deps` (Quality) are listed — Validates: FR-002, AC-008

Detail: P-001 is checked with `groups: ["Develop", "Create", "Repository"]` (Develop, Create, Repository, then the
rest alphabetically, after the ungrouped commands). P-003 also covers `list db` and `list --every` (exit 2) and a
registered `list` command winning over the built-in. P-005 covers surfaces, mobile, packages and seed packs.

## Architecture overview

The console kernel (`@stackra/console`) owns the list. `createConsole` reads two optional settings from
`ConsoleConfig`: `groups` (the heading order) and `unlisted` (a per-run test). On the list intent it keeps every
registered structure for `list --all`, else the ones neither hidden nor unlisted; the `--json` data is that set with
each structure as declared, and the text renderer gets the same set (with `list --all`, every row drawn) plus
`CommandListOptions` (`order`, `more`). Completion treats an unlisted command as hidden. `route` answers `list` and
`list --all` when no registered command is named `list`.

The CLI (`@stackra/cli`) declares a `group` on every command and passes `COMMAND_GROUPS` as `groups` and
`unlistedCommand(cwd)` as `unlisted`. `unlistedCommand` reads the workspace once, lazily, on the first question
(`readDoctorWorkspace`): in the core repository nothing is left out; elsewhere the Repository group is, and each
`COMMAND_FITS` command whose fit (`workspaceFits`) the workspace lacks.

## Components and responsibilities

- `ConsoleConfig.groups`, `ConsoleConfig.unlisted` (console `core/types`): the heading order and the per-run test.
- `CommandListOptions` (console `contracts/types`) and `Renderer.commandList(structures, binary, options?)`: how the
  list is drawn and how many it left out.
- `renderList` (console `core/functions`): the ordering and the `list --all` hint.
- `createConsole` (console `core/functions`): the list and completion filtering, the `--json` data.
- `route`, `LIST_COMMAND`, `LIST_ALL_FLAG` (console `core`): the built-in `list [--all]`.
- `TabCompletionsDriver` (console `node/drivers`): completes `list --all`.
- `COMMAND_GROUPS`, `CommandGroup`, `CliCommand.group` and `hidden` (cli): the headings and each command's place.
- `COMMAND_FITS`, `CommandFit`, `workspaceFits`, `isCoreRepository`, `unlistedCommand` (cli): the listing rules.
- `runCli` (cli): passes `groups` and `unlisted` to the console.

## Files and folders

Every file the change adds or edits (tests and the changeset aside), and the two package manifests whose scripts verify it:

```text
packages/developer/cli/package.json
packages/developer/console/package.json
apps/docs/src/docs/cli.ar.mdx
apps/docs/src/docs/cli.mdx
packages/developer/cli/README.md
packages/developer/cli/src/node/commands/add.command.ts
packages/developer/cli/src/node/commands/agents-check.command.ts
packages/developer/cli/src/node/commands/agents-sync.command.ts
packages/developer/cli/src/node/commands/any-ratchet.command.ts
packages/developer/cli/src/node/commands/app-native-deps.command.ts
packages/developer/cli/src/node/commands/architecture-map.command.ts
packages/developer/cli/src/node/commands/audit-verify.command.ts
packages/developer/cli/src/node/commands/catalogue-completeness.command.ts
packages/developer/cli/src/node/commands/constitution.command.ts
packages/developer/cli/src/node/commands/consumer-gate.command.ts
packages/developer/cli/src/node/commands/create.command.ts
packages/developer/cli/src/node/commands/cycles.command.ts
packages/developer/cli/src/node/commands/db-migrate.command.ts
packages/developer/cli/src/node/commands/db-rollback.command.ts
packages/developer/cli/src/node/commands/dev-secrets-init.command.ts
packages/developer/cli/src/node/commands/doc-standard.command.ts
packages/developer/cli/src/node/commands/doctor.command.ts
packages/developer/cli/src/node/commands/duplicate-exports.command.ts
packages/developer/cli/src/node/commands/duplication.command.ts
packages/developer/cli/src/node/commands/encore-prepare.command.ts
packages/developer/cli/src/node/commands/ls.command.ts
packages/developer/cli/src/node/commands/mcp-sync.command.ts
packages/developer/cli/src/node/commands/mobile-onboard.command.ts
packages/developer/cli/src/node/commands/ops-bootstrap-operator.command.ts
packages/developer/cli/src/node/commands/promote.command.ts
packages/developer/cli/src/node/commands/publish.command.ts
packages/developer/cli/src/node/commands/row-security-declarations.command.ts
packages/developer/cli/src/node/commands/runway.command.ts
packages/developer/cli/src/node/commands/search-reindex.command.ts
packages/developer/cli/src/node/commands/search-status.command.ts
packages/developer/cli/src/node/commands/settings-apply.command.ts
packages/developer/cli/src/node/commands/settings-diff.command.ts
packages/developer/cli/src/node/commands/skill-licences.command.ts
packages/developer/cli/src/node/commands/smoke.command.ts
packages/developer/cli/src/node/commands/structure.command.ts
packages/developer/cli/src/node/constants/command-fits.constant.ts
packages/developer/cli/src/node/constants/command-groups.constant.ts
packages/developer/cli/src/node/constants/commands.constant.ts
packages/developer/cli/src/node/constants/console-command.constant.ts
packages/developer/cli/src/node/constants/db-diff-command.constant.ts
packages/developer/cli/src/node/constants/db-seed-command.constant.ts
packages/developer/cli/src/node/constants/gen-command.constant.ts
packages/developer/cli/src/node/constants/mcp-command.constant.ts
packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts
packages/developer/cli/src/node/constants/new-command.constant.ts
packages/developer/cli/src/node/constants/seed-pack-command.constant.ts
packages/developer/cli/src/node/constants/testbed-command.constant.ts
packages/developer/cli/src/node/constants/validate-command.constant.ts
packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts
packages/developer/cli/src/node/eas-preflight/constants/eas-preflight-command.constant.ts
packages/developer/cli/src/node/functions/is-core-repository.function.ts
packages/developer/cli/src/node/functions/legacy-command.function.ts
packages/developer/cli/src/node/functions/run-cli.function.ts
packages/developer/cli/src/node/functions/unlisted-command.function.ts
packages/developer/cli/src/node/functions/workspace-fits.function.ts
packages/developer/cli/src/node/product/constants/build-command.constant.ts
packages/developer/cli/src/node/product/constants/deploy-command.constant.ts
packages/developer/cli/src/node/product/constants/preview-serve-command.constant.ts
packages/developer/cli/src/node/types/cli-command.type.ts
packages/developer/cli/src/node/types/command-fit.type.ts
packages/developer/cli/src/node/types/command-group.type.ts
packages/developer/cli/stackra.manifest.json
packages/developer/console/src/contracts/index.ts
packages/developer/console/src/contracts/ports/renderer.port.ts
packages/developer/console/src/contracts/types/command-list-options.type.ts
packages/developer/console/src/core/constants/list-all-flag.constant.ts
packages/developer/console/src/core/constants/list-command.constant.ts
packages/developer/console/src/core/drivers/text-renderer.driver.ts
packages/developer/console/src/core/functions/create-console.function.ts
packages/developer/console/src/core/functions/render-list.function.ts
packages/developer/console/src/core/functions/route.function.ts
packages/developer/console/src/core/types/console-config.type.ts
packages/developer/console/src/core/types/route-decision.type.ts
packages/developer/console/src/node/drivers/tab-completions.driver.ts
```

## Data models and migrations

none

## Contracts

- `ConsoleConfig.groups?: readonly string[]`; `ConsoleConfig.unlisted?: (structure: CommandStructure) => boolean`.
- `Renderer.commandList(structures: readonly CommandStructure[], binary: string, options?: CommandListOptions): void`;
  `CommandListOptions { order?: readonly string[]; more?: number }`, exported from `@stackra/console/contracts`.
- The built-in `list [--all]`; its `--json` data is the listed `CommandStructure` rows, each with its declared
  `hidden`.
- `CliCommand.group?: CommandGroup`, `CliCommand.hidden?: boolean`; `COMMAND_GROUPS`, `COMMAND_FITS`.

## Error handling

- `list` with an argument or an unknown option is a usage error (exit 2).
- A workspace that cannot be read lists as an app with none of the fits; listing never fails (EC-01).
- Every left-out command still runs by name; nothing about dispatch changes.

## Security and tenancy

None touched. The CLI reads the workspace's own package.json files, root `runway.yaml` and whether `seed-packs/`
exists, only when it lists or completes commands. No tenant data, secret or network call.

## Testing strategy

- P-001 to P-003, P-007: `command-list.test.ts` and `route.function.test.ts` in `@stackra/console`.
- P-004, P-005, P-008: `unlisted-command.function.test.ts`, `is-core-repository.function.test.ts`,
  `workspace-fits.function.test.ts` in `@stackra/cli`, on fixture workspaces in a temp folder.
- P-006, P-008: `commands.constant.test.ts`.
- Revert checks: undoing the list code in `create-console.function.ts`, `run-cli.function.ts` or the fit table fails
  its tests; typecheck, oxlint and oxfmt on both packages.

## Rollout

One minor changeset for `@stackra/console` and `@stackra/cli`. Additive: no command, option or exit code changes, and
a console without `groups` or `unlisted` lists as before. Ships with the next CLI release.
