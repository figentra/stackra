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

- **P-001**: with `groups: ["Develop", "Create", "Repository"]` the headings are drawn Develop, Create, Repository,
  then the rest alphabetically, after the ungrouped commands — Validates: FR-001
- **P-002**: an unlisted command is absent from the text list, the `--json` data and completion, and runs by name —
  Validates: FR-002, AC-004
- **P-003**: `list` equals the bare list; `list --all` holds every command; `list db` and `list --every` exit 2; a
  registered `list` command wins — Validates: FR-003, AC-003
- **P-004**: the minimal app lists exactly its 25 commands under the groups in order — Validates: AC-001, AC-002
- **P-005**: the core repository lists Repository; surfaces, mobile, packages and seed packs bring their commands —
  Validates: FR-002, AC-005
- **P-006**: every command names a group in `COMMAND_GROUPS`; the Repository and hidden sets are pinned — Validates:
  FR-001, AC-006

## Files

- `packages/developer/console/src/contracts/types/command-list-options.type.ts` (new), `contracts/index.ts`,
  `contracts/ports/renderer.port.ts`, `core/drivers/text-renderer.driver.ts`, `core/functions/render-list.function.ts`,
  `core/functions/create-console.function.ts`, `core/functions/route.function.ts`, `core/types/console-config.type.ts`,
  `core/types/route-decision.type.ts`, `core/constants/list-command.constant.ts` and `list-all-flag.constant.ts` (new),
  `node/drivers/tab-completions.driver.ts`
- `packages/developer/cli/src/node/constants/command-groups.constant.ts`, `command-fits.constant.ts`,
  `types/command-group.type.ts`, `types/command-fit.type.ts`, `functions/is-core-repository.function.ts`,
  `functions/workspace-fits.function.ts`, `functions/unlisted-command.function.ts` (new); `types/cli-command.type.ts`,
  `functions/legacy-command.function.ts`, `functions/run-cli.function.ts`, `constants/commands.constant.ts` and every
  command declaration (`group`, and `hidden` for the presets and plumbing)
