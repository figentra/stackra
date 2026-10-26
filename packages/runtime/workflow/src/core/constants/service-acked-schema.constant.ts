/**
 * Stackra file contract:
 * Purpose: `SERVICE_ACKED_SCHEMA`, the zod schema of `ServiceAcked` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `service-acked.event.ts` registers it, and
 *           it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0427 (decision 1).
 */
import { z } from "zod";

/** The shipped `ServiceAcked$`. */
export const SERVICE_ACKED_SCHEMA = z.object({
  subject: z.string().min(1).max(255),
  service: z.string().regex(/^[a-z][a-z0-9_]{0,62}$/, "Expected a member key such as commerce"),
});
