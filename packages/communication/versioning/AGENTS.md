# AGENTS — @stackra/versioning

Dated API versions and versioned integration events (ADR 0118, 0141, 0305). Member at
`packages/communication/versioning` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing… | It goes in…                                 |
| ---------------- | ------------------------------------------- |
| The kind base    | `src/core/bases/change.base.ts`             |
| A function       | `src/core/functions/<name>.function.ts`     |
| A type           | `src/core/types/<name>.type.ts`             |
| A constant       | `src/core/constants/<name>.constant.ts`     |
| A refusal        | `src/core/errors/<name>.error.ts`           |
| A test           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to `src/core/__tests__/index.test.ts`.
- `ChangeBase` and `EventChangeBase` are exported as types only. `isCalendarDate`, `eventChangeOf` and
  `CHANGE_REGISTRY` stay internal.

## This package

- `Change` is called only, with the subject as the type argument; `from` says the form (a whole version is an event
  change with `up` and `down`, a date is a dated response change with `down` only).
- Each change converts straight from and to the subject's current shape; never walk a chain of changes.
- Requests are never transformed (ADR 0118 decision 2). Paths never carry a version.
- No parameter properties and no `#private` fields; the source keeps to erasable syntax.

## PII

| Data             | Where                  | Handling                                                                  |
| ---------------- | ---------------------- | ------------------------------------------------------------------------- |
| Response payload | `downgrade`            | Transformed in memory only; never logged or stored here.                  |
| Event payload    | `upgrade`, `downgrade` | Checked by its version's schema; never logged or stored here.             |
| Version header   | `resolveVersion`       | Not echoed in a refusal; the refusal carries the supported dates instead. |
