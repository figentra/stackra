# Feature Specification: a Worker deploy streams its output and prints one line per phase, secrets masked

**Feature Branch**: `figentra/sta-2860-runway-stream-deploy-output`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2860

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: A Worker deploy through `@stackra/runway` prints nothing for many minutes; registry deploy attempt 5 was
silent for more than 8 minutes, so a stuck deploy looks the same as a working one. `runProgram` buffers a command's
output through `execFile` and returns it only when the command exits, and the `cloudflare-workers` driver prints
nothing while it uploads, runs the 0% smoke (up to 60 attempts 10 s apart) or holds each rollout step
(`ROLLOUT_HOLD_MS`, 5 minutes). Allowed under the STA-2845 Runway freeze as a fix.

### Sources

- `packages/developer/runway/src/node/functions/run-program.function.ts` (the buffered `execFile` runner before this
  change)
- `packages/developer/runway/src/node/types/command-runner.type.ts` (the `CommandRunner` contract)
- `packages/developer/runway/src/node/drivers/cloudflare-workers-provider.driver.ts` (the silent apply, smoke,
  rollout, verify and rollback)
- ADR 0352 decision 3 (the providers share one command runner), ADR 0173 (no secret is an argument or a log line),
  STA-2786 (the staged 0% smoke and the step smokes this change reports on)
- Linear STA-2860 (the CTO's diagnosis of 26 Nov and its Done-when)
- FR-001 to FR-005: the PR's diff against `main` and its tests (`run-program.function.test.ts`,
  `mask-secrets.function.test.ts`, `cloudflare-workers-provider.driver.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/runway (`runProgram`, `CommandRunner`, `CloudflareWorkersProviderDriver`,
  a new internal `maskSecrets`)
- **Public contract change**: additive. `CommandRunner`'s options gain an optional `onLine?: (line: string) => void`;
  `runProgram` honours it and is otherwise unchanged (same arguments, same answer, same error message);
  `CloudflareWorkersProviderDriver` gains a public `log: (line: string) => void` field (standard error by default). No
  export is removed or renamed; `maskSecrets` stays internal (not in the `.` or `./node` barrel).
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: every line the driver prints (phase lines, each command's streamed output) and the message
  of a failed command pass through `maskSecrets` with each member's declared secret values, its smoke bearers and the
  values of `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_API_TOKEN_READ`; a multi-line secret is masked line by line too. A
  masked failure is thrown without the raw error as its cause, so no cause chain carries the value.
- **Secrets**: none added; secret values are read only to mask them.
- **ADR needed**: no (applies ADR 0173 to the deploy log; ADR 0352 decision 3 keeps one runner)
- **New dependencies**: none (`node:child_process` `spawn` replaces `execFile`)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/runway/README.md`, `packages/developer/runway/AGENTS.md`, a patch changeset
  for `@stackra/runway`
- **Lane**: full (a new public field and option, and a security rule on what a deploy prints)
- **Change risk**: R1 (deploy log output only; the commands run, their order and the deploy decisions are unchanged)

## Glossary _(full lane)_

- **Phase line**: one line the driver prints at a deploy phase, `runway: <member>: <what happens>`.
- **Streamed output**: a command's own lines (wrangler, turbo), printed as `  | <line>` while it runs.
- **Mask**: replacing a secret value in a line with `***`.
- **Hold**: the wait between two partial rollout steps (`ROLLOUT_HOLD_MS`, 5 minutes).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A deploy shows where it is (Priority: P1)

An engineer watches the `runway-cloudflare-workers` job of a production registry deploy. The log shows the build, the
D1 migrations, the upload and the version id, the 0% stage and each smoke attempt with its answer, each rollout step
with its percentage, and each hold with its length and end time, so a stuck smoke or a long hold is told apart from a
hung command.

**Why this priority**: a silent deploy of 8 minutes or more could not be told apart from a hung one.

**Independent Test**: run `apply` against the fake Cloudflare of the driver tests with `log` captured and read the
phase lines.

**Acceptance Scenarios**:

1. **Given** a registry member with a 10/50/100 rollout, **When** `apply` ships it, **Then** the log reads, in order:
   build, D1 migrations, upload, `version <id> uploaded`, the 0% stage, `smoke <url> attempt 1/<n>: ok`, each
   `rollout step i/3: <id> at p%` with its `hold p% for 5 min (until <time>)`, each step's smoke, and
   `<id> serves 100%`.
2. **Given** a version that answers 503, **When** its 0% smoke runs, **Then** each attempt prints its answer and a
   final line says the version is taken out of the deployment with no traffic moved.
3. **Given** a step whose smoke fails, **When** the driver rolls back, **Then** it prints `roll back to <before>: <why>`
   and then the result of the rollback.

---

### User Story 2 - Nothing secret reaches the log (Priority: P1)

The same engineer, or anyone with read access to the job log, never sees a Worker secret, a smoke bearer or the
Cloudflare token, even when wrangler echoes one or fails with one in its message.

**Why this priority**: streaming a CLI's raw output into a shared CI log must not leak what the deploy holds.

**Independent Test**: a runner that prints the secret and the token on every command, and one that fails with the
secret in its message.

**Acceptance Scenarios**:

1. **Given** a command that prints the member's secret and the Cloudflare token, **When** its lines are streamed,
   **Then** each shows `***` instead and no line holds either value.
2. **Given** a command that fails with the secret in its message, **When** the error is thrown, **Then** its message
   shows `***`.

---

### User Story 3 - Output arrives while a command runs (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a program that prints a line and then waits for the caller to react to it, **When** `runProgram` runs it
   with `onLine`, **Then** the line arrives while the program still runs, a line split across writes arrives whole and
   the whole standard output is still answered.

---

### Edge Cases

- **EC-01**: Without `onLine`, `runProgram` streams nothing and answers exactly as before.
- **EC-02**: A line split across chunks is handed over once it ends; a last line without a newline is handed over when
  the program exits; a trailing CR is dropped.
- **EC-03**: A program that cannot start (ENOENT) is reported as `<command> <first arg> failed`, as before.
- **EC-04**: More than 16 MB on one stream kills the program and fails, as `execFile`'s `maxBuffer` did.
- **EC-05**: An empty secret value masks nothing; a short line of a multi-line secret (under 4 characters, "-----")
  is not masked on its own.
- **EC-06**: A failure whose message holds no secret is rethrown unchanged (its class and cause kept).
- **EC-07**: `verify` on a fresh driver (no `apply` before it) still masks each smoke bearer: the bearers are added to
  the mask when a member's smoke runs.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `CommandRunner` options SHALL accept an optional `onLine`, and `runProgram` SHALL hand it each line
  the program prints on standard output and standard error as it is printed, while still answering the whole standard
  output.
- **FR-002**: THE `cloudflare-workers` driver SHALL print one line to its `log` per phase: build, each D1 migration,
  upload, the version id, the 0% stage, each smoke attempt with its answer, each rollout step with its percentage,
  each hold with its length and end time, each step's smoke result, any rollback and its result, and the lines of
  `verify` and `rollback`.
- **FR-003**: THE driver SHALL stream each deploy command's output (build, migrations, upload, each `versions deploy`,
  each rollback) to its `log` line by line while the command runs.
- **FR-004**: THE driver SHALL mask every secret value of the deploy (each member's secrets, its smoke bearers, the
  Cloudflare API tokens) in every line it prints and in the message of a failed command.
- **FR-005**: THE driver's `log` SHALL write to standard error by default.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a Worker member ships through a stepped rollout THE driver SHALL print the phase lines of FR-002 in
  order, each starting `runway: <member>:`.
- **AC-002**: WHEN a smoke attempt runs THE driver SHALL print the URL, the attempt number of its limit and the answer.
- **AC-003**: WHEN a command prints a secret value or a Cloudflare token THE driver SHALL print `***` in its place.
- **AC-004**: WHEN a command fails with a secret value in its message THE driver SHALL throw the message with `***`.
- **AC-005**: WHEN a program prints a line and keeps running THE `runProgram` runner SHALL hand the line to `onLine`
  before the program exits.

## Success Criteria _(mandatory)_

- **SC-001**: the "deploy log (STA-2860)" block of `cloudflare-workers-provider.driver.test.ts` proves AC-001 to AC-004
  and FR-005, and its eight tests fail against `main`'s driver — verified by: unit
- **SC-002**: `run-program.function.test.ts` ("streams each line while the program still runs") proves AC-005 and EC-02
  and fails against `main`'s `runProgram`; `mask-secrets.function.test.ts` proves FR-004's masking and EC-05 —
  verified by: unit
- **SC-003**: the `@stackra/runway` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Nothing to change for a consumer: `onLine` and `log` are optional additions, and `runProgram` answers and fails as
  before.
- A deploy job's standard error now carries the phase lines and wrangler's streamed output; a script that parsed the
  provider's standard output is unaffected.
- `runProgram` uses `spawn` instead of `execFile`. Standard input stays an open pipe when no `input` is given, as before.

## Risks

- **R-1**: A secret the driver does not know of (a value another tool printed) is not masked. Mitigated: the driver
  masks every value it reads or sends; CI's own masking (`::add-mask::` in the secrets-decrypt action) still applies.
- **R-2**: A secret printed in another encoding (JSON-escaped, base64) is not matched. wrangler prints secret names,
  not values; the risk is low and the mask matches the value as written.
- **R-3**: More log volume in CI. One line per phase and wrangler's own output; a deploy of one Worker adds tens of
  lines.

## Out of scope

- Streaming the output of the `encore-cloud`, `eas`, `mintlify` and edge KV drivers (they can pass `onLine` the same
  way).
- A heartbeat line during a hold (the hold line names its end time).

## Assumptions

- The deploy job's standard error is shown in its log in real time (GitHub Actions does).
- Secret values are at least a few characters long, so masking them does not blank ordinary output.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2860 session) · created from the CTO's diagnosis and the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2860 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2860 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2860 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2860 session) · T001 to T008 committed on the branch
