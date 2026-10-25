/**
 * Stackra file contract:
 * Purpose: `STATE_TRANSITIONED_SCHEMA`, the zod schema of `StateTransitioned` that this package ships (its `X$`).
 * Boundary: the stand-in for what gen will write for this package. Internal: `state-transitioned.event.ts` registers
 *           it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0161 (decision 4: history).
 */
import { z } from "zod";

/** The shipped `StateTransitioned$`. */
export const STATE_TRANSITIONED_SCHEMA = z.object({
  machine: z.string().min(1),
  transition: z.string().min(1),
  field: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  recordId: z.string().exactOptional(),
});
