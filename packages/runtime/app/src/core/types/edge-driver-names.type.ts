/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entries of the `EdgeSigningKeys` and `EdgeNonceStore` ports, so the `EdgeConfig` fields
 *          typed `DriverName<…>` and their runway values take exactly this package's driver names.
 * Boundary: a module augmentation only; the stand-in for the entries this package's generated wiring writes (ADR 0263
 *           decision 9). `EdgeOptions` imports this file so the augmentation travels with the shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4 and 19); ADR 0263 (decision 9); ADR 0437 (decision 4).
 */
import type { EDGE_DRIVERS } from "#core/constants/edge-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `EdgeSigningKeys` (`memory`, `env`). */
    "app.EdgeSigningKeys": (typeof EDGE_DRIVERS.keys)[number];
    /** The driver names of `EdgeNonceStore` (`memory`). */
    "app.EdgeNonceStore": (typeof EDGE_DRIVERS.nonces)[number];
  }
}
