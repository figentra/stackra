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

## Constitution check

- Boundaries: runtime imports `@stackra/money` only (and `@stackra/contracts` in `stackra.config.ts`).
- Versions: `workspace:*` and catalogs only.
- Naming: noun value classes with no suffix (`price-point.value.ts` → `PricePoint`), as `Money`.
- No kind, decorator or registry (registry A9); no custom error class (refusals are `RangeError`, as in money).

## Properties

- **P-001**: For every point and non-negative price, `apply(p, Up) >= p`, `apply(p, Down) <= p` when `p` is above the
  first point, and the result minus `ending` is a multiple of `step`.
- **P-002**: For every band list, `total(q + 1) - total(q)` is the unit price of the band holding unit `q + 1`.
