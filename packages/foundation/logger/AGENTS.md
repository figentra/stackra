# AGENTS — @stackra/logger

The driver behind the `Logger` port, its reporter and two configurations. Member at `packages/foundation/logger`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). One entry, `.`.

## Where code goes

| You are writing…                     | It goes in…                                           |
| ------------------------------------ | ----------------------------------------------------- |
| A configuration                      | `src/config/<name>.config.ts`                         |
| A driver                             | `src/core/drivers/<name>.driver.ts`                   |
| A port (no `./contracts` entry here) | `src/core/ports/<name>.port.ts`                       |
| A function, enum, constant, schema   | `src/core/{functions,enums,constants,schemas,types}/` |
| A test                               | `__tests__/<name>.<kind>.test.ts` beside it           |

## This package

- Code logs through the `Logger` port of `@stackra/contracts`; nothing outside the container imports this package's
  driver directly.
- Every record passes `redact` before any reporter sees it. A new reporter reuses `redact`; never bypass it.
- `.` stays bundle-safe (no `node:*`); the console reporter writes through `console`.
- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

| Data       | Where                  | Handling                                                                                |
| ---------- | ---------------------- | --------------------------------------------------------------------------------------- |
| Log fields | `LogRecord`, reporters | Credential and personal-data names, `@Classified` fields and token patterns are masked. |
