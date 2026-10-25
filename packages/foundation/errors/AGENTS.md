# AGENTS — @stackra/errors

Refusals and the error envelope. Member at `packages/foundation/errors` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                        | It goes in…                                               |
| --------------------------------------- | --------------------------------------------------------- |
| The kind base (`Refusal`)               | `src/core/bases/refusal.base.ts`                          |
| A core refusal                          | `src/core/errors/<name>.error.ts`, and `CoreRefusals`     |
| A function, a type, a constant, an enum | `src/core/{functions,types,constants,enums}/`             |
| A port                                  | `src/contracts/ports/<name>.port.ts`                      |
| React code                              | `src/react/<name>/`                                       |
| A test helper or matcher                | `src/testing/functions/`, `src/testing/<name>.matcher.ts` |
| A test                                  | `__tests__/<name>.<kind>.test.ts(x)` beside it            |

## Entries and barrels

- `src/{core,contracts,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- `ErrorReporter` is exported from `./contracts` only, never from `.` (ADR 0294 decision 15). `./contracts` imports no
  other entry; `./react` and `./testing` import `.` and `./contracts`.
- `./testing` registers `toRefuseWith` when imported; `sideEffects` stays `false` (the validator requires it for
  `tier:lib`), which is safe because only vitest loads `./testing`, and it never tree-shakes.

## This package

- The code of a refusal comes from `refusalCode` only; gen calls the same function. Never add a `code` option.
- A refusal keeps no state of its own: kind and options live in the container's kind registry; code, category and
  details are read on demand. Field errors and the cause are non-enumerable so they never count as details.
- `isRefusal` uses the `Symbol.for` brand, never `instanceof`, so refusals from another bundle count.
- A reporter never throws and never awaits in `report`; it sends no request context, input or user (ADR 0184).
- A new `ErrorKind` is an ADR change (0140). A new core refusal needs a platform step that raises it.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data              | Where                         | Handling                                                                              |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| Refusal `details` | the envelope, `ErrorReporter` | Whatever the thrower sets; never put a person's data in details. Stored nowhere here. |
