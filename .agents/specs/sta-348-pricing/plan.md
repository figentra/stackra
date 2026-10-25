# Plan: `@stackra/pricing` wave 2

**Spec**: `.agents/specs/sta-348-pricing/spec.md`

## Design

- `src/core/values/price-point.value.ts`: `PricePoint` (`step`, `ending`, `currency`). `apply` is
  `price.minus(ending).divide(step, rounding).times(step).plus(ending)`: above the first point the offset is positive,
  so `Money`'s zero-relative rounding is also the upward or downward choice, and no rounding code is duplicated.
  At or below the first point it returns the first point; zero returns itself.
- `src/core/types/price-tier.type.ts`: `PriceTier = { upTo: number | null; unitPrice: Money }`.
- `src/core/values/graduated-price.value.ts`: `GraduatedPrice` (`tiers`, `currency`); `total` sums
  `unitPrice.times(units)` per band, integer factors only, so the total is exact.
- `src/core/index.ts`: the stand-in barrel until gen writes entries (STA-339); tool configs follow the money member.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                  |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/commerce/pricing`; workspace imports: `@stackra/contracts`, `@stackra/money` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                   |
| Security                              | N/A    | price arithmetic only; no auth, tenant data or outbound call                                                                                          |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                          |
| Tenancy                               | N/A    | no tenant data                                                                                                                                        |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                      |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                     |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                       |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                    |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                               |

- Boundaries: runtime imports `@stackra/money` only (and `@stackra/contracts` in `stackra.config.ts`).
- Versions: `workspace:*` and catalogs only.
- Naming: noun value classes with no suffix (`price-point.value.ts` → `PricePoint`), as `Money`.
- No kind, decorator or registry (registry A9); no custom error class (refusals are `RangeError`, as in money).

## Properties

- **P-001**: For every point and non-negative price, `apply(p, Up) >= p`, `apply(p, Down) <= p` when `p` is above the first point, and the result minus `ending` is a multiple of `step` — Validates: FR-003
- **P-002**: For every band list, `total(q + 1) - total(q)` is the unit price of the band holding unit `q + 1` — Validates: FR-004
- **P-003**: `package.json` names `@stackra/pricing` at `packages/commerce/pricing`, `exports` lists only `.`, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-004**: `.` exports `PricePoint`, `GraduatedPrice` and the type `PriceTier`, and nothing else — Validates: FR-002
- **P-005**: no file under `src/` calls `createKind`, `createDecorator` or `registerKind`, so the package adds no kind, decorator or registry — Validates: FR-005
- **P-006**: `package.json` `dependencies` lists `@stackra/money` and `@stackra/contracts` as `workspace:*` and nothing else — Validates: FR-006
- **P-007**: every non-test source file opens with the Stackra file contract and has one exported declaration with TSDoc, and every test sits in `__tests__/` and imports from `@stackra/testing` — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
