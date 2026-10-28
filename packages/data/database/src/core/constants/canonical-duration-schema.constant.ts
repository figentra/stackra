/**
 * Stackra file contract:
 * Purpose: `CANONICAL_DURATION_SCHEMA`, the zod schema of a duration field in `DatabaseConfig`: ISO 8601 (`PT2S`) or the short
 *          form (`2s`), read into its canonical `Duration` so a driver can time it.
 * Boundary: unlike @stackra/platform's `DURATION_SCHEMA`, which only checks the text, this one rewrites either form
 *           (`2s`, `PT2S`) into the canonical `Duration` a driver times. An internal part of this package's shipped config schema, not exported. A value that is neither form is a
 *           config issue, never a throw.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); stackra-223 (both duration forms).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

/** A duration in either form, stored canonical. */
export const CANONICAL_DURATION_SCHEMA = z.string().transform((text, context): Duration => {
  try {
    return Duration.parse(text);
  } catch {
    context.addIssue({ code: "custom", message: `"${text}" is not a duration such as PT2S or 2s` });
    return z.NEVER;
  }
});
