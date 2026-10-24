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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                       |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/foundation/errors`; workspace imports: `@stackra/container`, `@stackra/contracts` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                        |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                      |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                               |
| Tenancy                               | N/A    | no tenant data                                                                                                                                             |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                     |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                           |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                  |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                          |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                            |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                         |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                    |

- Boundaries: runtime imports `@stackra/contracts` and `@stackra/container` only; React and `@stackra/testing` are
  optional peers; `./react` and `./testing` import `.`/`./contracts` through aliases; `./contracts` is a leaf.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; error classes end in `Error`; machine codes snake_case.
- No parameter properties and no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./react` and `./testing` — Validates: FR-001
- **P-002**: `.` exports `CoreRefusals`, `ErrorKind`, `ForbiddenError`, `Refusal`, `WorkflowTimedOutError`, `isRefusal`, `refusalCode`, the other core refusals and the envelope types — Validates: FR-002
- **P-003**: `./contracts` exports `ErrorReporter`, and `.` does not — Validates: FR-003
- **P-004**: `./react` exports `useErrorReporter`, and `./testing` exports `refusal` and `toRefuseWith` — Validates: FR-004
- **P-005**: `refusalCode(OrderNotPayableError)` returns `order_not_payable`, and `Refusal({ kind })` is called, never constructed, so gen and the runtime derive the same code from one function — Validates: FR-005
- **P-006**: `isRefusal(value)` recognises a refusal by its `Symbol.for` brand, so it holds for a refusal class loaded from a second copy of the package where `instanceof` does not — Validates: FR-006
- **P-007**: `package.json` `dependencies` lists `@stackra/contracts` and `@stackra/container` and nothing else — Validates: FR-007
