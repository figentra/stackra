/**
 * Stackra file contract:
 * Purpose: `CROSS_APP_ENVELOPE_SCHEMA`, the zod schema the consumer's inbox parses a verified delivery's body with:
 *          the `EventEnvelope` fields plus `envelopeVersion` 1.
 * Boundary: internal. It strips unknown keys, `producer` among them: the inbox sets `producer` from the verified
 *           sender only. The event's data is checked later against its own event schema by the inbox.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 11 and 19, amendment of 2026-11-02); ADR 0141 (decision 2).
 */
import { z } from "zod";

/** The parsed cross-app envelope, without `producer`. */
export const CROSS_APP_ENVELOPE_SCHEMA = z.object({
  id: z.string().startsWith("evt_").max(64),
  type: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+\.v\d+$/),
  occurredAt: z.iso.datetime({ offset: true }),
  scope: z.object({ id: z.string().startsWith("scp_"), path: z.string() }).optional(),
  meta: z.record(z.string(), z.unknown()),
  data: z.unknown(),
  envelopeVersion: z.literal(1),
});
