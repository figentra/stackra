/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `Database`, so `DriverName<Database>` is `"postgres" | "memory"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `DatabaseConfigOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { DATABASE_DRIVERS } from "#core/constants/database-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `Database` (`postgres`, `memory`). */
    "database.Database": (typeof DATABASE_DRIVERS)[number];
  }
}
