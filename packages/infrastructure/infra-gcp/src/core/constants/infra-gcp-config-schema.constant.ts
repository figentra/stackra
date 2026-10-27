/**
 * Stackra file contract:
 * Purpose: `InfraGcpConfig$`, the shipped schema of `InfraGcpOptions`: the health driver's target, defaulted.
 * Boundary: authored until gen compiles `InfraGcpOptions` into `#stackra/schemas` (STA-339); mirrors the shape field for
 *           field, so `.parse({})` gives the defaults and a member's override schema can `.extend` it.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decision 26).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's InfraGcpOptions into #stackra/schemas; replace with STA-339.
/** The shipped `InfraGcpConfig$`. */
export const InfraGcpConfig$ = z.object({
  region: z
    .string()
    .regex(/^(|[a-z]+(-[a-z]+)+\d+)$/, "Expected empty or a GCP region (me-central2)")
    .default(""),
});
