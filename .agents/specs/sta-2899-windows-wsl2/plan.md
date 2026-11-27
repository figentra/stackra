# Implementation Plan: Windows through WSL 2 on day one, and process runners that start Windows shims

**Spec**: `.agents/specs/sta-2899-windows-wsl2/spec.md` · **Linear**: STA-2899 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2899-windows-wsl2/spec.md`

## Summary

Both process runners start tools through cross-spawn: `child_process.spawn` with no shell on macOS and Linux, and on
Windows the `.cmd` shim run through cmd.exe with each argument escaped. `toolEnv` builds `runProcess`'s environment with
one `PATH` key. `platformCheck` is the first row of `doctorChecks`, so `stackra doctor`, `stackra dev` and
`stackra create` all name WSL 2 on native Windows. `cleanScript` writes a `clean` script with no `rm` for the members
`stackra new` writes; the starter's four members take the same script. A `Windows smoke` CI job runs the Windows-only
test cases on windows-latest.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/cli`, `packages/developer/console`; the template repository's members and README
- **Testing**: vitest in `src/**/__tests__/`; the `.cmd` shim cases run only on Windows (`it.runIf(win32)`), in the
  `Windows smoke` job; on Linux a spy on cross-spawn proves the runners go through it
- **Storage**: none
- **Runtime target**: developer machines (macOS, Linux, WSL 2) and CI

## Constitution Check

| Law                                   | Result | Note                                                                    |
| ------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | no new member edge; one third-party dependency in two developer members |
| Secrets (ADR 0009)                    | N/A    | none read or written                                                    |
| Security                              | PASS   | arguments never shell-parsed; `cleanScript` refuses non-plain paths     |
| HTTP and events                       | N/A    | none                                                                    |
| Tenancy                               | N/A    | none                                                                    |
| Delegation                            | PASS   | Claude only                                                             |
| Not built yet (ADR 0011)              | N/A    | none                                                                    |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                                   |
| Versions and catalogs                 | PASS   | cross-spawn in the default catalog; changeset: cli minor, console patch |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                                                       |
| Licence tier (ADR 0077)               | PASS   | free, MIT; cross-spawn is MIT                                           |
| Docs and ADRs                         | PASS   | quickstart, customer install guide, CLI README, template README         |

## Deploy modes

| Mode       | Behaviour                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| SaaS       | unchanged: developer tooling only; nothing a deployed app runs changes        |
| On-prem    | unchanged: the same CLI on the operator's machine, with the same doctor row   |
| Air-gapped | unchanged: the doctor row reads only the local platform and makes no call out |

## Correctness properties

- **P-001**: `doctorChecks(root, empty, { quick: true })` returns `supported system` first, then `mise installed`;
  with the platform set to win32 the first row warns and names `wsl --install` — Validates: AC-001, AC-002
- **P-002**: `platformCheck` passes darwin, linux and a `-microsoft-standard-WSL2` release; warns on win32, a
  `-Microsoft` release (WSL 1, naming the distribution) and freebsd — Validates: AC-002
- **P-003**: `runProcess` and the console runner call cross-spawn once with the command and arguments; on Windows a
  `stackra-echo.cmd` in `node_modules/.bin` starts by its bare name and receives `two words`, `a&b|c` and `say "hi"`
  intact — Validates: AC-003
- **P-004**: `toolEnv` with `Path`, `PATH` or none inherited leaves exactly the key `PATH`, the bins first and the last
  inherited spelling after them — Validates: AC-004
- **P-005**: `cleanScript([...])` run through `spawnSync(script, { shell: true })` removes folders and a file, ignores a
  missing one, contains no `rm`, refuses `../up`, `/abs`, `a b`, `$(x)`, `a;b`, `.`, `dist/..`; the package and service
  templates use it — Validates: AC-005
- **P-006**: `stackra-console create` without `--no-install` runs `pnpm install` through the process port in the new
  folder — Validates: AC-006

## Architecture overview

`runProcess(run, io)` → `crossSpawn(run.command, run.args, { cwd, env: toolEnv(cwd, run.env), stdio })`.
`NodeProcessRunnerDriver.run` → `crossSpawn(command, args, { cwd, env, stdio })`. cross-spawn reports a command cmd.exe
cannot find as an ENOENT `error`, so both keep resolving 127 with the reason. `doctorChecks` calls `platformCheck()`
before every other check, so the row is in the quick and fresh lists too; `which` is untouched (STA-2859).

## Components and responsibilities

- `platformCheck` (cli doctor function, pure): the supported-system row from the platform, kernel release and
  environment.
- `doctorChecks`: adds that row first.
- `toolEnv` (cli function, pure): one `PATH` key, the `node_modules/.bin` folders first.
- `runProcess` (cli function): starts the tool through cross-spawn with `toolEnv`.
- `cleanScript` (cli function, pure): the portable `clean` script; used by `packageTemplate` and `serviceTemplate`.
- `scaffold`: its `pnpm exec oxfmt` step through `crossSpawn.sync`.
- `NodeProcessRunnerDriver` (console driver): starts the child through cross-spawn.
- `stackra-console create`: installs through `io.process.run` (the process port).
- `Windows smoke` (CI job): the Windows-only test cases on windows-latest, switched by `CI_WINDOWS`.

## Files and folders

```text
.changeset/windows-wsl2-process-runners.md
.github/workflows/ci.yml
pnpm-workspace.yaml
pnpm-lock.yaml
apps/docs/src/docs/quickstart.mdx
apps/docs/src/docs/customers/install.mdx
packages/developer/cli/README.md
packages/developer/cli/package.json
packages/developer/cli/src/node/doctor/functions/platform-check.function.ts
packages/developer/cli/src/node/doctor/functions/doctor-checks.function.ts
packages/developer/cli/src/node/functions/tool-env.function.ts
packages/developer/cli/src/node/functions/run-process.function.ts
packages/developer/cli/src/node/functions/clean-script.function.ts
packages/developer/cli/src/node/functions/package-template.function.ts
packages/developer/cli/src/node/functions/service-template.function.ts
packages/developer/cli/src/node/scaffold/functions/scaffold.function.ts
packages/developer/cli/src/node/**/__tests__/ (the tests)
packages/developer/console/package.json
packages/developer/console/src/node/drivers/node-process-runner.driver.ts
packages/developer/console/src/node/commands/create.command.ts
packages/developer/console/src/node/**/__tests__/ (the tests)
```

The template repository (stackra-template, branch `figentra/sta-2899-windows-wsl2`): `README.md`,
`apps/console/package.json`, `apps/docs/package.json`, `packages/application/example/package.json`,
`services/example/package.json`.

## Data models and migrations

none

## Contracts

- `stackra doctor` checklist and `--json` rows, added first: `{ name: "supported system", status: "ok" | "warn",
detail, fix? }` in the Machine group.
- The `clean` script `stackra new` writes: `node -e "…rmSync…" dist coverage .turbo .stackra` (was `rm -rf …`).
- `runProcess`: a `PATH` in `ToolRun.env` is now the inherited path (was ignored). No export, port, type or manifest
  changes.
- CI: repository variable `CI_WINDOWS` (`smoke` | `off`, unset = `smoke`).

## Error handling

- A tool that cannot start still resolves 127 with the reason (`runProcess` on `io.err`, the console runner in its
  output); on Windows cross-spawn turns cmd.exe's "not recognized" exit into the same ENOENT `error`.
- The scaffold's format step throws the spawn error, or an error naming the exit status.
- `cleanScript` throws on a path that is not plain and relative (a template bug, never user input).
- The doctor row is a warning: it never changes the exit code.

## Security and tenancy

Arguments are never parsed as shell syntax: elsewhere there is no shell; on Windows cross-spawn escapes each argument
for cmd.exe (twice for a `node_modules/.bin` shim). The clean script holds only plain relative names. No secret, tenant
or personal data is read.

## Testing strategy

- AC-001, AC-002: `doctor-checks.function.test.ts` (child processes mocked, platform set to win32 for one case) and
  `platform-check.function.test.ts`.
- AC-003: `run-process.function.test.ts` and `node-process-runner.driver.test.ts` (a spy on cross-spawn; the `.cmd`
  shim case on Windows).
- AC-004: `tool-env.function.test.ts`.
- AC-005: `clean-script.function.test.ts` (runs the script under this system's shell, cmd.exe on Windows).
- AC-006: `create.command.test.ts` with a scripted process runner.
- AC-007: the `Windows smoke` job itself; actionlint and zizmor in the gate.
- Revert check: each source put back to origin/main makes its test fail (run on box 2).

## Rollout

A minor changeset for `@stackra/cli` and a patch for `@stackra/console`. The template takes the portable clean scripts
and the README line in its own pull request. The `Windows smoke` job runs on this pull request; if it is red for a
reason outside this change, set `CI_WINDOWS=off` and open an issue.

## Delegation and risk plan

Claude builds; the CTO reads. R1. Route `spec-task`.

## ADRs

ADR 0295 decision 5 (members call `stackra` and node); ADR 0506 (the console process port); ADR 0027 (toolchain from
mise, in the Windows job too).

## Docs

apps/docs quickstart and customers/install, the CLI README, the template README and the changeset.

## Complexity tracking

none
