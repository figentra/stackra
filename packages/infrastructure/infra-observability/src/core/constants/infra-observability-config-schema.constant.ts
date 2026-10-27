/**
 * Stackra file contract:
 * Purpose: `InfraObservabilityConfig$`, the shipped schema of `InfraObservabilityOptions`: the health driver's target, defaulted.
 * Boundary: authored until gen compiles `InfraObservabilityOptions` into `#stackra/schemas` (STA-339); mirrors the shape field for
 *           field, so `.parse({})` gives the defaults and a member's override schema can `.extend` it.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decision 26).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's InfraObservabilityOptions into #stackra/schemas; replace with STA-339.
/** The shipped `InfraObservabilityConfig$`. */
export const InfraObservabilityConfig$ = z.object({
  url: z
    .string()
    .regex(/^(|https:\/\/[^\s/]+(\/\S*)?)$/, "Expected empty or an https:// URL")
    .default(""),
});
