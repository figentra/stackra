---
"@stackra/runway": minor
"@stackra/cli": patch
---

`runCommand` in `@stackra/runway/node` is now `runProgram` (STA-2040), from `run-program.function.ts`; it behaves the
same. `@stackra/console` owns the command vocabulary, so `runCommand` is its name alone and the duplicate-export check
no longer flags it. Import `runProgram` where you imported runway's `runCommand`. `@stackra/cli`'s deploy command uses
the new name.
