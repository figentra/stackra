/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `SessionStore`, so `DriverName<SessionStore>` is
 *          `"bff" | "memory" | "pkce"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `IdentityOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { SESSION_STORE_DRIVERS } from "#core/constants/session-store-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `SessionStore` (`bff`, `memory`, `pkce`). */
    "identity.SessionStore": (typeof SESSION_STORE_DRIVERS)[number];
  }
}
