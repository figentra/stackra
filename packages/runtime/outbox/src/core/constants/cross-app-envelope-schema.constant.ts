/**
 * Stackra file contract:
 * Purpose: `CROSS_APP_ENVELOPE_SCHEMA`, how a consumer's inbox reads a verified body: the event id, a versioned wire
 *          name, the ISO occurred-at time, the optional scope, the meta, the data and `envelopeVersion: 1`.
 * Boundary: internal; read only after the sender is verified. A `producer` in the body is dropped (the inbox sets it
 *           from the verifying contract), as is any other unknown field. The event's own data is checked later by the
 *           inbox against the event's schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11 and 19); ADR 0141 (decision 2).
 */
import { z } from "zod";

/** A cross-app envelope as received. */
export const CROSS_APP_ENVELOPE_SCHEMA = z.object({
  id: z.string().min(1).max(64),
  type: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+\.v\d+$/),
  occurredAt: z.iso.datetime({ offset: true }),
  scope: z.object({ id: z.string().min(1), path: z.string().min(1) }).optional(),
  meta: z.looseObject({}),
  data: z.unknown(),
  envelopeVersion: z.literal(1),
});
