/**
 * Stackra file contract:
 * Purpose: `ANALYTICS_DELIVERY_SCHEMA`, the zod schema of one kept `AnalyticsDelivery`, which the storage offline queue
 *          checks each stored item against before the client sends it again.
 * Boundary: internal. A stored value comes from outside the code (another version wrote it, the device edited it), so
 *           it is checked at the trust boundary; an item that fails is skipped, never sent. Mirrors the envelope v2
 *           type with `kind` and `groups`; a change to the type changes this in the same commit.
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0095 as amended (Zod at the boundary).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { AnalyticsDeliveryKind } from "#contracts/enums/analytics-delivery-kind.enum";

/** A kept delivery. */
export const ANALYTICS_DELIVERY_SCHEMA = z.object({
  eventId: z.string().min(1),
  kind: z.enum(Enum.values(AnalyticsDeliveryKind)).optional(),
  name: z.string().min(1),
  properties: z.record(z.string(), z.unknown()),
  occurredAt: z.string().min(1),
  anonymousId: z.string().min(1),
  userId: z.string().min(1).optional(),
  groups: z.record(z.string().min(1), z.string().min(1)).optional(),
  sessionId: z.string().min(1),
  context: z.object({
    library: z.object({ name: z.string(), version: z.string().optional() }),
    page: z.object({ path: z.string() }).optional(),
    screen: z.object({ name: z.string() }).optional(),
    locale: z.string().optional(),
    appVersion: z.string().optional(),
    region: z.string().optional(),
  }),
});
