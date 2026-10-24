# Plan: `@stackra/money` wave 1b

**Spec**: `.agents/specs/sta-348-money/spec.md`

## Design

- `src/core/constants/currencies.constant.ts`: `CURRENCIES`, a frozen map of ISO 4217 code to its exponent (minor
  digits). Internal: not exported from the entry.
- `src/core/types/currency-code.type.ts`: `CurrencyCode = keyof typeof CURRENCIES` (a literal union).
- `src/core/enums/rounding.enum.ts`: `Rounding`, `Enum.of` from `@stackra/contracts`.
- `src/core/values/money.value.ts`: the `Money` class. Arithmetic runs on BigInt: a factor or divisor is read as the
  decimal its `String()` prints, as an exact ratio, and the quotient is rounded once by the mode. Every result passes
  the safe-integer check before it becomes a `number`. Allocation is the largest-remainder method on exact integer
  weights, ties to the earlier index.
- `src/core/functions/currency-code.function.ts`: `currencyCode()` is `z.enum` of the codes.
- `src/core/functions/money.function.ts`: `money()` is `z.codec(z.object({ minor: z.int(), currency }), z.custom<Money>)`;
  `z.int()` in zod 4 accepts safe integers only.
- `src/core/index.ts`: the stand-in barrel until gen writes entries (STA-339); tool configs follow the contracts
  member until gen writes them.

## Constitution Check

| Law                                   | Result | Note                                                                                                                              |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/commerce/money`; workspace imports: `@stackra/contracts` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                               |
| Security                              | N/A    | money values only; no auth, tenant data or outbound call                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                      |
| Tenancy                               | N/A    | no tenant data                                                                                                                    |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer            |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                  |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                         |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                 |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                           |

- Boundaries: runtime imports `@stackra/contracts` (`Enum`) and `zod` only; dev-only `@stackra/testing` and presets.
- Versions: catalogs and `workspace:*` only.
- Naming: `money()` and `currencyCode()` are the names generated code imports (template); `CURRENCIES` is a
  module-level constant (SCREAMING_SNAKE).
- No custom error class: wave 1b cannot depend on `@stackra/errors` (wave 1c); refusals are `RangeError`.

## Properties

- **P-001**: For every amount and every valid ratio list, `allocate(r)` parts sum to the amount and differ from the exact shares by less than one minor unit — Validates: FR-004
- **P-002**: For every mode, `divide(d, mode)` and `times(1/d, mode)` agree when `1/d` prints exactly — Validates: FR-004, FR-007
- **P-003**: `z.encode(money(), money().parse(w))` equals `w` for every valid wire value `w` — Validates: FR-008
- **P-004**: `package.json` names `@stackra/money` at `packages/commerce/money`, `exports` lists only `.`, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-005**: `.` exports `Money`, `Rounding`, `money`, `currencyCode` and the type `CurrencyCode`, and nothing else — Validates: FR-002
- **P-006**: `"USD"` is assignable to `CurrencyCode` and `"usd"` is not (type test), and every code in the union has minor units — Validates: FR-003
- **P-007**: `Money.ofMinor` and every result of `plus`, `minus`, `times` and `divide` refuse a value that is not a safe integer — Validates: FR-005
- **P-008**: `Money.of(decimal, currency)` returns an equal `Money` for equal literal arguments and reads nothing else, so gen can evaluate it in a default — Validates: FR-006
- **P-009**: `Rounding` has the cases `Down`, `Up`, `HalfUp` and `HalfEven`, and `times` and `divide` default to `HalfEven` — Validates: FR-007
- **P-010**: `package.json` `dependencies` lists `@stackra/contracts` as `workspace:*` and `zod` as `catalog:` and nothing else — Validates: FR-009
- **P-011**: every non-test source file opens with the Stackra file contract and has one exported declaration with TSDoc, and every test sits in `__tests__/` and imports from `@stackra/testing` — Validates: FR-010

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
