---
"@stackra/runway": minor
"@stackra/cli": patch
---

Runway's child-process helper is `runProgram` (was `runCommand`, file `run-program.function.ts`): a Command is a
CLI command only (ADR 0294 d23), and `@stackra/console` exports `runCommand` (one symbol, one owner, d15). Behaviour
unchanged. The duplicate-exports allowance for `runCommand` is gone.
