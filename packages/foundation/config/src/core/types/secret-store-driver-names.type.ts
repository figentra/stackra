/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `SecretStore`, so `DriverName<SecretStore>` is
 *          `"memory" | "aws_secrets_manager"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `SecretsOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { SECRET_STORE_DRIVERS } from "#core/constants/secret-store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `SecretStore` (`memory`, `aws_secrets_manager`). */
    "config.SecretStore": (typeof SECRET_STORE_DRIVERS)[number];
  }
}
