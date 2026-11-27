# Feature Specification: Windows through WSL 2 on day one, and process runners that start Windows shims

**Feature Branch**: `figentra/sta-2899-windows-wsl2`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (technical stop; approval pending)

**Linear**: STA-2899

**Clarifications status**: complete

**Input**: On native Windows `stackra create` failed at "Installing with pnpm" with exit code 127 and no hint. Both
process runners (`runProcess` in `@stackra/cli`, `NodeProcessRunnerDriver` in `@stackra/console`) spawned with no shell,
so the `.cmd` shims a package manager writes (`pnpm.cmd`, `node_modules/.bin/vitest.cmd`) never started; the members
`stackra new` writes and the starter's members cleaned with `rm -rf`, which Windows does not have; and nothing said
which systems Stackra supports. Audit item 24.4 of the 26 Nov production-readiness audit (STA-2796, batch 24).

### Sources

- Linear STA-2899 ("Done when"), under STA-2796
- `packages/developer/cli/src/node/functions/run-process.function.ts` (its "no shell, so `.cmd` shims do not start"
  shortcut note)
- `packages/developer/console/src/node/drivers/node-process-runner.driver.ts`
- `packages/developer/cli/src/node/doctor/functions/doctor-checks.function.ts` (`which` stays: STA-2859, batch 13.3)
- `packages/developer/cli/src/node/functions/package-template.function.ts` and `service-template.function.ts`
- cross-spawn 7.0.6 (`lib/parse.js`: on win32 a non-`.exe` command runs through `cmd.exe /d /s /c` with every argument
  escaped, twice for a `node_modules/.bin` shim)
- ADR 0295 decision 5 (members call `stackra` and node); ADR 0506 (the console process port); ADR 0027 (toolchain
  from mise)

## Impact

- **Apps touched**: apps/docs (quickstart "Supported systems", the customer install guide's requirements)
- **Services touched**: none
- **Packages touched**: packages/developer/cli (`runProcess`, `toolEnv`, `platformCheck`, `doctorChecks`, `cleanScript`,
  the package and service templates, the scaffold's format step); packages/developer/console (`NodeProcessRunnerDriver`,
  `stackra-console create`)
- **Public contract change**: yes, additive. The `stackra doctor` checklist (and its `--json` rows) gains a first row,
  `supported system`, in the Machine group: `ok` on macOS, Linux and WSL 2, `warn` on native Windows, WSL 1 and any
  other system. The `clean` script `stackra new` writes changes text (same effect). No export, port or manifest changes.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: arguments are still never parsed as shell syntax: elsewhere cross-spawn is
  `child_process.spawn` with no shell; on Windows it escapes each argument for cmd.exe. `cleanScript` accepts only
  plain relative names.
- **Secrets**: none
- **ADR needed**: no; implements the supported-systems statement of audit item 24.4 within ADR 0295 and ADR 0506
- **New dependencies**: `cross-spawn` 7.0.6 (MIT) and `@types/cross-spawn` 6.0.6, default catalog, in cli and console
- **Deploy modes**: none (developer tooling)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: the doctor checklist row only
- **Docs to update**: apps/docs quickstart (Supported systems, Windows through WSL 2), apps/docs customers/install
  (Requirements), packages/developer/cli README (doctor row), the template README (Quick start), the changeset
- **Lane**: lite
- **Change risk**: R1 (POSIX behaviour unchanged; a new warning row that never fails; a non-required CI job)

## Acceptance criteria

- **AC-001**: THE `stackra doctor` checklist SHALL open with a `supported system` row, kept by `--quick` (the check
  `stackra dev` runs) and by the fresh check `stackra create` runs.
- **AC-002**: WHEN the system is native Windows or WSL 1, THE row SHALL be a warning (never a failure) whose fix names
  `wsl --install` or `wsl --set-version <distribution> 2` and the docs page; macOS, Linux and WSL 2 SHALL pass.
- **AC-003**: THE `runProcess` and `NodeProcessRunnerDriver` SHALL start every tool through cross-spawn, so on Windows a
  `.cmd` shim starts by its bare name with its arguments intact.
- **AC-004**: THE `runProcess` SHALL hand the tool exactly one `PATH` key, with every `node_modules/.bin` from its
  directory up in front of the inherited path, whatever spelling (`Path`) the inherited environment uses.
- **AC-005**: WHEN `stackra new` writes a package or service member, THE member's `clean` script SHALL remove its
  folders under sh and cmd.exe alike, without `rm`, and treat a missing folder as no error.
- **AC-006**: THE `stackra-console create` install and the scaffold's format step SHALL start the package manager
  through the same cross-spawn path (the process port, or cross-spawn directly).
- **AC-007**: THE CI SHALL run the Windows cases on a hosted windows-latest runner in a job that is not required and that
  the repository variable `CI_WINDOWS` switches (`smoke`, the default, or `off`).
- **AC-008**: THE docs SHALL state the supported systems (macOS, Linux, Windows through WSL 2) and how to set up WSL 2.

## Compatibility and migration

- macOS, Linux and WSL 2: no behaviour change except the new first doctor row (`ok`). A `--json` consumer that reads
  rows by index shifts by one; rows carry their `name`.
- A `PATH` passed in `ToolRun.env` is now the inherited path the bins go in front of (it was ignored).
- Existing members keep their `rm -rf` clean script until they adopt the new one; the starter ships the portable one.

## Risks

- The Windows cases (`.cmd` shim, cmd.exe clean) are proved only by the `Windows smoke` job; the box is Linux. The job
  has not run green before this pull request; if it is red for a reason outside this change, set `CI_WINDOWS=off` and
  open an issue.
- On Windows `runProcess`'s timeout kills cmd.exe, not a grandchild a shim started; timeouts are used for testbed probes
  (`ssh`, an `.exe`, which needs no cmd.exe).

## Open questions

None.

## Status history

- 2026-11-27 → Clarified (audit claim re-verified on origin/main: no shell in either runner, `rm -rf` clean scripts)
- 2026-11-27 → Planned (plan.md)
- 2026-11-27 → Tasked (tasks.md)
- 2026-11-27 → Implementing (built in this branch; awaiting the CTO's approval)
