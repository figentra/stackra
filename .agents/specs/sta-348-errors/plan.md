# Plan: `@stackra/errors` wave 1c

**Spec**: `.agents/specs/sta-348-errors/spec.md`

## Design

- `Refusal` is built with container's `createKind("refusal", RefusalBase, read)`; `read` refuses a kind outside
  `ErrorKind`. `RefusalBase extends Error` holds no state: `kind` and `retryable` read the kind registry through
  `kindOf`, `code` calls `refusalCode(constructor.name)`, `category` reads `Enum.meta(ErrorKind, kind)`, `details` are
  the own enumerable fields that are set. `create(details, { fieldErrors, cause })` assigns the details and defines
  field errors and the cause as non-enumerable. `name` and `message` (the code) are prototype accessors.
- `ErrorKind` is `Enum.of` with `{ category, httpStatus, retryable }` per kind: the one table gen's transport mapping
  and the runtime read. `ErrorCategory` is derived from it.
- `isRefusal` checks a `Symbol.for("stackra.errors.refusal")` brand on the prototype and compares codes for a class.
- `CoreRefusals` keys the eight core refusal classes by code.
- `./contracts`: `ErrorReporter extends Port` with `report(error)`. `./react`: `useErrorReporter` resolves it from
  `useContainer()` and returns a memoised `report`.
- `./testing`: `refusal(X, partial & { fields })` builds through `create`; `toRefuseWith` (via `createMatcher`) reads a
  refusal, a `{ ok: false, error }` result or an envelope and compares code, set details and field errors.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts` and `@stackra/container` only; React and `@stackra/testing` are
  optional peers; `./react` and `./testing` import `.`/`./contracts` through aliases; `./contracts` is a leaf.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; error classes end in `Error`; machine codes snake_case.
- No parameter properties and no `#private` fields.
