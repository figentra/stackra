/**
 * Stackra file contract:
 * Purpose: `VERSIONING_CONFIG_SCHEMA`, the zod schema this package ships for `VersioningConfig`: the `YYYY-MM-DD`
 *          dates the service serves, oldest first.
 * Boundary: the stand-in for what gen writes for this package. `supported` defaults to empty, which is the dormant API.
 * Runtime: isomorphic
 * Governing contract: ADR 0118 (API versions are dates); ADR 0294 (decision 26).
 */
import { z } from "zod";

/** The shipped `VersioningConfig$`. */
export const VERSIONING_CONFIG_SCHEMA = z.object({
  supported: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .refine((days) => days.every((day, index) => index === 0 || (days[index - 1] ?? "") < day), {
      message: "supported dates are sorted, oldest first, without repeats",
    })
    .default(() => []),
});
