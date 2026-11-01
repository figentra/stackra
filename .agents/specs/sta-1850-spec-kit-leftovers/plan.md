# Plan: remove spec-kit leftovers (STA-1850)

1. `doctor-command.constant.ts`: drop the spec-kit check, its imports and its docblock mention.
2. Delete `speckit-pin.function.ts` and `speckit-matches.function.ts`; drop their imports and the docblock mention in
   `doctor.test.ts`.
3. Delete `tools/scripts/spec-checks.mjs` and `tools/scripts/__tests__/spec-wrappers.test.mjs`.
4. Add a patch changeset for `@stackra/cli`. Tests run in CI.
