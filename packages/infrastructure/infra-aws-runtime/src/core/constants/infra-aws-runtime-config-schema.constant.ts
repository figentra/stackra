/**
 * Stackra file contract:
 * Purpose: `InfraAwsRuntimeConfig$`, the shipped schema of `InfraAwsRuntimeOptions`: the health driver's target, defaulted.
 * Boundary: authored until gen compiles `InfraAwsRuntimeOptions` into `#stackra/schemas` (STA-339); mirrors the shape field for
 *           field, so `.parse({})` gives the defaults and a member's override schema can `.extend` it.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decision 26).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's InfraAwsRuntimeOptions into #stackra/schemas; replace with STA-339.
/** The shipped `InfraAwsRuntimeConfig$`. */
export const InfraAwsRuntimeConfig$ = z.object({
  region: z
    .string()
    .regex(/^(|[a-z]{2}(-[a-z]+)+-\d)$/, "Expected empty or an AWS region (me-central-1)")
    .default(""),
});
