/**
 * Stackra file contract:
 * Purpose: `KEPT_RECORDS_SCHEMA`, the shipped `KeptRecords$`: one kind of rows a service kept instead of disposing of
 *          them (its model key, `hold` or `retention`, and a count).
 * Boundary: shape only, no ids. `ServiceAcked$` lists it, and the `kept` fields of `ServiceAcked`, `AllServicesAcked`
 *           and `ServiceAckSet` name it through their `@Field` hatch.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); STA-1312; STA-344.
 */
import { z } from "zod";

/** The shipped `KeptRecords$`. */
export const KEPT_RECORDS_SCHEMA = z.object({
  kind: z
    .string()
    .max(255)
    .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, "Expected a model key such as orders.order"),
  reason: z.enum(["hold", "retention"]),
  count: z.number().int().min(0),
});
