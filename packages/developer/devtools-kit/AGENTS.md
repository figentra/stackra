# AGENTS — @stackra/devtools-kit

The devtools kit (ADR 0246). Member at `packages/developer/devtools-kit` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). Entry `.` only (ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…             | It goes in…                                 |
| ---------------------------- | ------------------------------------------- |
| The kit and its host session | `src/core/services/devtools-kit.service.ts` |
| Errors, constants, types     | `src/core/{errors,constants,types}/`        |
| A test                       | `__tests__/<name>.<kind>.test.ts` beside it |

## This package

- No UI, no transport, no Node import: the host (the app panel, the `stackra dev` console) owns those.
- It never imports another package's devtools entry; those import it.
- A host callback never throws into the kit's caller.
- Development only (ADR 0246 decision 1): nothing in a production path may require it.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

The kit holds whatever packages put in tabs and stream payloads, including event payloads from the bus. A tab with
personal data or secrets' names sets `sensitive: true`; the bus timeline carries events as they are.
