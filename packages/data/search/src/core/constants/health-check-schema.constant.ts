/**
 * Stackra file contract:
 * Purpose: `HEALTH_CHECK_SCHEMA`, the zod schema of the `health` field of `SearchConfig`: how long `SearchHealthIndicatorDriver` waits for its
 *          probe, which searchable table it searches (`schema.table` or `table`, and its key), and whether a failed probe
 *          fails `/readyz` (`critical`) or only degrades it.
 * Boundary: an internal part of this package's shipped config schema, not exported. Every field has a default, so
 *           `.parse({})` gives the defaults the options class initializes (tested). Runway sets it per environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); registry gap R-27; gap analysis devx-ops "Health checks" (P0, owner D10).
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

/** The shipped `health` field: a two second probe whose failure fails readiness; no table until runway names one. */
export const HEALTH_CHECK_SCHEMA = z
  .object({
    timeout: z
      .custom<Duration>(isDuration, { message: "Expected an ISO 8601 duration such as PT2S" })
      .default(Duration.seconds(2)),
    critical: z.boolean().default(true),
    table: z.string().default(""),
    primaryKey: z.string().min(1).default("id"),
  })
  .default(() => ({ timeout: Duration.seconds(2), critical: true, table: "", primaryKey: "id" }));
