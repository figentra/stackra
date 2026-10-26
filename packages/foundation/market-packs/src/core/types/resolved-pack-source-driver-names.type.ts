/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `ResolvedPackSource`, so `DriverName<ResolvedPackSource>` is
 *          `"store" | "memory"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `MarketPacksOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0418; ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { RESOLVED_PACK_SOURCE_DRIVERS } from "#core/constants/resolved-pack-source-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `ResolvedPackSource` (`store`, `memory`). */
    "market_packs.ResolvedPackSource": (typeof RESOLVED_PACK_SOURCE_DRIVERS)[number];
  }
}
