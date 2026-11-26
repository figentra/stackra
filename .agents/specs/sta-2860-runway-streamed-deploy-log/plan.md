# Implementation Plan: a Worker deploy streams its output and prints one line per phase, secrets masked

**Spec**: `.agents/specs/sta-2860-runway-streamed-deploy-log/spec.md` · **Linear**: STA-2860 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2860-runway-streamed-deploy-log/spec.md`

## Summary

`runProgram` moves from `execFile` to `spawn`: it collects the standard output it answers as before and, when the new
optional `onLine` option is given, hands each complete line of standard output and standard error over as it is
printed. The `cloudflare-workers` driver gains a `log` field (standard error by default), prints one masked phase line
per deploy phase through a private `say`, and runs each deploy command through a private `exec` that streams its lines
to `log` (masked) and masks a failed command's message. A new internal pure function `maskSecrets` does the masking.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/runway` (`@stackra/runway`)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); `runProgram` runs the current Node binary; the driver runs
  against the fake Cloudflare of its tests (STA-2786)
- **Storage**: none
- **Runtime target**: node (`./node`); `maskSecrets` is isomorphic

## Constitution Check

| Law                                   | Result | Note                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | only `@stackra/runway` changes                                         |
| Secrets (ADR 0009, ADR 0173)          | PASS   | values are read only to mask them; no secret is printed or an argument |
| Security                              | PASS   | every printed line and a failed command's message are masked           |
| HTTP and events                       | N/A    | no route, header or event changes                                      |
| Tenancy                               | N/A    | no tenant data                                                         |
| Delegation                            | PASS   | one session, one branch                                                |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                 |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                     |
| Versions and catalogs                 | PASS   | no dependency added                                                    |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                      |
| Licence tier (ADR 0077)               | PASS   | free                                                                   |
| Docs and ADRs                         | PASS   | README, AGENTS.md and a changeset; applies ADR 0352 d3 and ADR 0173    |

## Deploy modes

| Mode       | Behaviour                                                   |
| ---------- | ----------------------------------------------------------- |
| SaaS       | the deploy job's log shows each phase and wrangler's output |
| On-prem    | same                                                        |
| Air-gapped | same                                                        |

## Correctness properties

- **P-001**: for every program and every split of its output into chunks, the lines handed to `onLine` are exactly the
  lines it printed (CR dropped), each once, and the answer is the whole standard output — Validates: FR-001
- **P-002**: for every stepped rollout, the phase lines name each step's percentage and each hold's length — Validates:
  FR-002
- **P-003**: for every line printed and every secret value `s` of the deploy (non-empty), the line does not contain `s`
  — Validates: FR-003, FR-004
- **P-004**: a failed command's message contains no secret value of the deploy — Validates: FR-004
- **P-005**: a driver built with no `log` writes each line, with a newline, to standard error — Validates: FR-005

## Architecture overview

`runProgram` spawns the program with three pipes, decodes both output streams as UTF-8, appends each chunk to its
stream's text (failing at 16 MB) and, with `onLine`, splits the stream's pending text on newlines, handing every
complete line over and keeping the rest. On `close` it flushes each stream's last partial line, then answers the
standard output (exit 0) or rejects with `<command> <first arg> failed: <stderr>` (as before). The driver collects the
deploy's secret values once its secrets are read (before anything ships), and `say` / `exec` mask every line with them
and with the Cloudflare tokens' values.

## Components and responsibilities

- `runProgram` (`src/node/functions/run-program.function.ts`): `spawn`, streaming with `onLine`, the 16 MB cap.
- `CommandRunner` (`src/node/types/command-runner.type.ts`): the optional `onLine` option.
- `maskSecrets` (`src/core/functions/mask-secrets.function.ts`): longest-first replacement with `***`, multi-line
  secrets line by line, internal.
- `CloudflareWorkersProviderDriver` (`src/node/drivers/cloudflare-workers-provider.driver.ts`): `log`, the private
  `secretValues`, `say`, `mask` and `exec`, and the phase lines in `apply`, `rollOut`, `probe`, `verify` and
  `rollback`.

## Files and folders

```text
packages/developer/runway/
├── AGENTS.md
├── README.md
└── src/
    ├── core/functions/
    │   ├── mask-secrets.function.ts
    │   └── __tests__/mask-secrets.function.test.ts
    └── node/
        ├── drivers/
        │   ├── cloudflare-workers-provider.driver.ts
        │   └── __tests__/cloudflare-workers-provider.driver.test.ts
        ├── functions/
        │   ├── run-program.function.ts
        │   └── __tests__/run-program.function.test.ts
        └── types/command-runner.type.ts
.changeset/
└── runway-streamed-deploy-log.md
```

- `packages/developer/runway/src/node/functions/run-program.function.ts`
- `packages/developer/runway/src/node/types/command-runner.type.ts`
- `packages/developer/runway/src/core/functions/mask-secrets.function.ts`
- `packages/developer/runway/src/node/drivers/cloudflare-workers-provider.driver.ts`
- `packages/developer/runway/src/node/functions/__tests__/run-program.function.test.ts`
- `packages/developer/runway/src/core/functions/__tests__/mask-secrets.function.test.ts`
- `packages/developer/runway/src/node/drivers/__tests__/cloudflare-workers-provider.driver.test.ts`
- `packages/developer/runway/README.md`, `packages/developer/runway/AGENTS.md`, `.changeset/runway-streamed-deploy-log.md`

## Data models and migrations

none

## Contracts

- `CommandRunner` options: `onLine?: ((line: string) => void) | undefined` (new, optional).
- `runProgram`: signature, answer and error message unchanged; honours `onLine`.
- `CloudflareWorkersProviderDriver.log: (line: string) => void` (new public field; standard error by default).
- Callers: `stackra deploy` / `stackra promote` (`runwayProviders` in `@stackra/cli`) get the log with no code change;
  the other drivers keep calling `runProgram` without `onLine`.

## Error handling

A failed command whose message holds a secret value is thrown as a new `Error` with the masked message and no cause (so
no cause chain prints the value); any other failure is rethrown unchanged, so the driver's existing handling (code
10007, the rollback after a failed step) still sees it. `runProgram` keeps its failure message.

## Security and tenancy

The values masked are each member's declared secrets (from the sops scope or the job's environment), its smoke bearers
and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_API_TOKEN_READ`; they are collected before the first command of `apply` runs.
No value is written anywhere new; the secrets file stays a 0600 file removed after the upload.

## Testing strategy

- AC-001, AC-002: "prints one line per phase: upload, version id, each smoke attempt, each step with its hold" and
  "prints each failed smoke attempt, taking the version out after a failed 0% smoke", "prints the rollback after a
  failed step, and its result", "prints a line when verify smokes and when rollback returns each member".
- AC-003: "streams each command's output line by line with every secret and the Cloudflare token masked".
- AC-004: "masks a secret in a failed command's error, and prints the failure".
- AC-005: `run-program.function.test.ts` "streams each line while the program still runs, and still answers the whole
  output" (the program waits for a file only `onLine` creates; a buffered runner fails it).
- FR-005: "writes to standard error by default".
- Revert check: with `main`'s driver, runner and type, the eight driver tests and the streaming test fail.

## Rollout

A patch changeset for `@stackra/runway`. The next deploy of a Worker through `stackra deploy` prints its progress.

## Delegation and risk plan

One session, one branch. Budget: small (one PR). Follow-up (spec out of scope): pass `onLine` in the other drivers.

## ADRs

ADR 0352 decision 3 (one command runner for every provider), ADR 0173 (no secret is an argument or a log line),
ADR 0536 / STA-2786 (the smokes reported on): all Accepted.

## Docs

`packages/developer/runway/README.md`, `packages/developer/runway/AGENTS.md`, `.changeset/runway-streamed-deploy-log.md`.

## Complexity tracking

none
