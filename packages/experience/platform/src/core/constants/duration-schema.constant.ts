/**
 * Stackra file contract:
 * Purpose: `DURATION_SCHEMA`, the zod check of a `Duration` field in this package's shipped config schemas
 *          (`checkEvery`, `maxAge`, `networkTimeout`, `bannerAfter`): an ISO 8601 duration as `Duration` writes it.
 * Boundary: internal; not exported from the entry. It accepts what `Duration.parse` accepts and outputs the branded
 *           type, so a generated `X$Check` sees `Duration`, not `string`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`).
 */
import { Duration } from "@stackra/contracts";
import { z } from "zod";

/** Whether `value` is an ISO 8601 duration. */
function isDuration(value: unknown): value is Duration {
  if (typeof value !== "string") return false;
  try {
    Duration.parse(value);
    return true;
  } catch {
    return false;
  }
}

/** A `Duration` field. */
export const DURATION_SCHEMA = z.custom<Duration>(isDuration, {
  message: "Expected an ISO 8601 duration such as PT3S",
});
