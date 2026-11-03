# AGENTS — @stackra/console

The command framework and terminal look of every Stackra CLI (ADR 0506, spec `.agents/specs/sta-1730-console`).
Member at `packages/developer/console` (`tier:lib`).

## Where code goes

| You are writing…                                   | It goes in…                                      |
| -------------------------------------------------- | ------------------------------------------------ |
| A public type a CLI author names                   | `src/contracts/types/`                           |
| The kind, decorators, kernel, output, prompt logic | `src/core/{bases,decorators,functions,types}/`   |
| Anything that touches `process`, a TTY or a file   | `src/node/`                                      |
| The test harness                                   | `src/testing/`                                   |
| A test                                             | `__tests__/<subject>.test.ts` beside its subject |

## Rules

- No module's commands here: database, cache, queue and the rest live in their own packages (owner, 2026-10-31).
- Every component reads the decided `ConsoleMode`; never test a TTY or an environment variable outside
  `decideMode`, so plain output stays one code path.
- Measure text with `displayWidth`, never `.length`; never emit bidi isolates from a component (terminals draw them); `isolateBidi` is for callers who want it.
- A password answer never reaches the output, an error or a log.
- Third-party dependencies sit behind a port and need the owner's approval (ADR 0506, 2026-11-02 amendment):
  `@clack/prompts` behind `Prompter`, `@bomb.sh/tab` behind `Completions`, and `ink` with `react` behind `Renderer`, for
  live parts only. Colours come from `node:util` and the terminal prompter runs on `node:readline`.
- `json: "bare"` is for a CLI whose `--json` shape an ADR has frozen (testbed, ADR 0522). Every other CLI keeps the envelope.
- An `inherit` child shares the standard streams and is never captured or redacted, so `createProcess` refuses it while the
  run holds a secret value. Under `--json` it writes to stderr only.
- `src/node/constants/app-versions.constant.ts` follows the core catalogs; bump it with them.

## PII

| Data                 | Where                                     | Handling                                                                                            |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| The operator's login | `CommandIo.operator`, command audit entry | Read from `STACKRA_OPERATOR`, `USER`, `LOGNAME` or `USERNAME`; passed to the audit port only.       |
| Secret option values | prompts, child output, errors             | A password is never echoed; secret values are redacted from child output, errors and audit entries. |
