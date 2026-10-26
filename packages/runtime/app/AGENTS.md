# AGENTS — @stackra/app

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/app: where code goes, entries and barrels, the package rules (the server boot and
         shutdown order included) and the rules that fail the build.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0305; ADR 0263; ADR 0260 (decision 4); ADR 0251 (decision 3).
-->

The app runtime: `createApp` per runtime target, the shared boot, the client contexts and the `Controller` kind.
Member at `packages/runtime/app` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./react`, `./server`, `./worker`, `./browser`, `./native`, `./desktop` (ADR 0295 decision 8; ADR 0127 2026-10-24
note).

## Where code goes

| You are writing…                     | It goes in…                                    |
| ------------------------------------ | ---------------------------------------------- |
| Boot shared by every target          | `src/core/{functions,services,drivers,types}/` |
| A target's `createApp` and its types | `src/<target>/{functions,types}/`              |
| The `Controller` kind                | `src/server/bases/controller.base.ts`          |
| A refusal                            | `src/<target>/errors/<name>.error.ts`          |
| React contexts                       | `src/react/contexts/`                          |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## Entries and barrels

- `src/*/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public file to its
  barrel and to that entry's `index.test.ts`.
- Every target imports `.` through `#core/*`; `.` imports no target. `./browser` and `./native` mount `Contexts` from
  `#react/*`. No symbol is exported from two entries.
- `.` loads no React, React Router, Electron or React Native; each optional peer is imported only by the entry that
  needs it.

## This package

- `Module`, `Service` and `define*` do not live here (ADR 0127 2026-10-24 note); never add them back.
- Configuration is built by `bootApp` from the target's raw env and bound under the base class; never read
  `process.env` or `import.meta.env` anywhere else.
- The server `createApp` awaits `options.boot` once the container is ready and aborts its signal in `close()` after
  the drain and before `container.close()`; the bus, inbox and relay stop there.
- Report each unexpected error once through the `ErrorReporter`; never report a refusal.
- The desktop hardening baseline is not configurable (ADR 0251 decision 3).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                    | Where                          | Handling                                                                 |
| ----------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Environment and secrets | process memory (config fields) | Read by name into configuration instances; never logged or serialised.   |
| Bridge call inputs      | Electron main process          | Passed to the bridge as they are; never logged here.                     |
| Unexpected errors       | `ErrorReporter`                | Passed as they are; the reporter driver scrubs personal data (ADR 0232). |
