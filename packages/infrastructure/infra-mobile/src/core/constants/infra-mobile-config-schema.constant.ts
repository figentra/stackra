/**
 * Stackra file contract:
 * Purpose: `InfraMobileConfig$`, the shipped schema of `InfraMobileOptions`: the health driver's target, defaulted.
 * Boundary: authored until gen compiles `InfraMobileOptions` into `#stackra/schemas` (STA-339); mirrors the shape field for
 *           field, so `.parse({})` gives the defaults and a member's override schema can `.extend` it.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decision 26).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's InfraMobileOptions into #stackra/schemas; replace with STA-339.
/** The shipped `InfraMobileConfig$`. */
export const InfraMobileConfig$ = z.object({
  projectId: z
    .string()
    .regex(
      /^(|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/,
      "Expected empty or an Expo project id (a UUID)",
    )
    .default(""),
});
