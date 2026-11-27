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

## Correctness properties

- **P-001**: `doctorChecks(root, empty, { quick: true })` returns `supported system` first, then `mise installed`;
  with the platform set to win32 the first row warns and names `wsl --install` — Validates: AC-001, AC-002
- **P-002**: `platformCheck` passes darwin, linux and a `-microsoft-standard-WSL2` release; warns on win32, a
  `-Microsoft` release (WSL 1, naming the distribution) and freebsd — Validates: AC-002
- **P-003**: `runProcess` and the console runner call cross-spawn once with the command and arguments; on Windows a
  `stackra-echo.cmd` in `node_modules/.bin` starts by its bare name and receives `two words`, `a&b|c` and
  `say "hi"` intact — Validates: AC-003
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

## CI

`.github/workflows/ci.yml` job `windows` ("Windows smoke"): windows-latest, mise (node, pnpm), `pnpm install
--frozen-lockfile --ignore-scripts` for the root and the two members' closures, then `turbo run test` for the named test
files of each member (which builds the CLI and runs gen first). `if: (vars.CI_WINDOWS || 'smoke') == 'smoke'`. Not in
the ruleset's required checks.
