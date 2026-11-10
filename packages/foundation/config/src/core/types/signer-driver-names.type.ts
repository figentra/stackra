/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `Signer`, so `DriverName<Signer>` is `"ephemeral" | "kms"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `SignerOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { SIGNER_DRIVERS } from "#core/constants/signer-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `Signer` (`ephemeral`, `kms`). */
    "contracts.Signer": (typeof SIGNER_DRIVERS)[number];
  }
}
