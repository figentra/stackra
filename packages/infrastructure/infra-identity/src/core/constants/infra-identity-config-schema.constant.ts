/**
 * Stackra file contract:
 * Purpose: `InfraIdentityConfig$`, the shipped schema of `InfraIdentityOptions`: the health driver's target, defaulted.
 * Boundary: authored until gen compiles `InfraIdentityOptions` into `#stackra/schemas` (STA-339); mirrors the shape field for
 *           field, so `.parse({})` gives the defaults and a member's override schema can `.extend` it.
 * Runtime: isomorphic
 * Governing contract: ADR 0402 (decision 5); ADR 0294 (decision 26).
 */
import { z } from "zod";

// shortcut: authored until gen compiles this package's InfraIdentityOptions into #stackra/schemas; replace with STA-339.
/** The shipped `InfraIdentityConfig$`. */
export const InfraIdentityConfig$ = z.object({
  domain: z
    .string()
    .regex(
      /^(|(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63})$/,
      "Expected empty or a host name without a scheme",
    )
    .default(""),
});
