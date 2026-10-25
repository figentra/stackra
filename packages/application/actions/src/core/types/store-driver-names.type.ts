/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the `IdempotencyStore` and `RateLimitStore` ports, so the `StoresConfig`
 *          fields typed `DriverName<…>` and their runway values take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entries this package's generated wiring writes (ADR 0263
 *           decision 9). `StoresOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9).
 */
import type { STORE_DRIVERS } from "#core/constants/store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `IdempotencyStore` (`memory`, `valkey`). */
    "actions.IdempotencyStore": (typeof STORE_DRIVERS)[number];
    /** The driver names of `RateLimitStore` (`memory`, `valkey`). */
    "actions.RateLimitStore": (typeof STORE_DRIVERS)[number];
  }
}
