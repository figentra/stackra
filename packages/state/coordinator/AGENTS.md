# AGENTS — @stackra/coordinator

Tab leader election and tab locks. Member at `packages/state/coordinator` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…         | It goes in…                                 |
| ------------------------ | ------------------------------------------- |
| A function or a method   | `src/core/functions/<name>.function.ts`     |
| A type                   | `src/core/types/<name>.type.ts`             |
| An enum                  | `src/core/enums/<name>.enum.ts`             |
| A constant, module state | `src/core/constants/<name>.constant.ts`     |
| A test                   | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to it
  and to `src/core/__tests__/index.test.ts`.
- The three methods (`electByWebLocks`, `electByBroadcastChannel`, `electInMemory`), `detectElectionMethod`, the message
  and flag types and `MEMORY_ELECTIONS` stay internal.

## This package

- A method is a plain function `(name, flag, ...) => leave`; it sets the flag to `true` when it leads (and to `false`
  when it steps down on its own); `electLeader` sets it to `false` after calling `leave`.
- Lock and channel names are `ELECTION_PREFIX + name`.
- `signal` comes from `@stackra/state/react`, which `src/core` may not import (`boundaries.jsonc`); the two imports carry
  a reasoned `oxlint-disable-next-line`. Remove them when `@stackra/state` exports `signal` from `.`.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

None. Election names and random participant ids only; nothing is stored or logged.
