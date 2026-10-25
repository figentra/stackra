/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `LoyaltyLedger`, so `DriverName<LoyaltyLedger>` is `"postgres" | "memory"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `LoyaltyKitOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { LOYALTY_LEDGER_DRIVERS } from "#core/constants/loyalty-ledger-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `LoyaltyLedger` (`postgres`, `memory`). */
    "loyalty_kit.LoyaltyLedger": (typeof LOYALTY_LEDGER_DRIVERS)[number];
  }
}
