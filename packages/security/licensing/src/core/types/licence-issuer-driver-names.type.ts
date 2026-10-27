/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `LicenceIssuer`, so `DriverName<LicenceIssuer>` is `"registry" | "keygen" | "memory"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `issuer-options.schema.ts` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { LICENCE_ISSUER_DRIVERS } from "#core/constants/licence-issuer-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `LicenceIssuer` (`registry`, `keygen`, `memory`). */
    "licensing.LicenceIssuer": (typeof LICENCE_ISSUER_DRIVERS)[number];
  }
}
