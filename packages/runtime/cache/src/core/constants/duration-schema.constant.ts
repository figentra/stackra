/**
 * Stackra file contract:
 * Purpose: `DURATION_SCHEMA`, the zod schema of a duration config value: ISO 8601 (`PT5S`) or the short form (`5s`),
 *          read into its canonical form so a driver can time it.
 * Boundary: internal to the package; the shipped config schema uses it for `fill.wait` and `fill.poll`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0150 (decision 4).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

/** A duration in ISO 8601 or the short form, as its canonical `Duration`. */
export const DURATION_SCHEMA = z.string().transform((text, context): Duration => {
  try {
    return Duration.parse(text);
  } catch {
    context.addIssue({ code: "custom", message: `"${text}" is not a duration such as PT5S or 5s` });
    return z.NEVER;
  }
});
