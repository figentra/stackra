/**
 * Stackra file contract:
 * Purpose: `DELIVERY_RECORDED_SCHEMA`, the zod schema this package ships for `DeliveryRecorded`: the delivery id, the
 *          channel, the provider code, the status and the time.
 * Boundary: the stand-in for what gen will write for this package; internal, registered by the event file. Ids and
 *           codes only, never an address or content.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0223; stackra-207 (STA-1360).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { NotificationChannel } from "#contracts/enums/notification-channel.enum";

/** The shipped `DeliveryRecorded$`. */
export const DELIVERY_RECORDED_SCHEMA = z.object({
  deliveryId: z.string().min(1).max(256),
  channel: z.enum(
    Enum.values(NotificationChannel) as [NotificationChannel, ...NotificationChannel[]],
  ),
  provider: z.string().min(1).max(64),
  status: z.enum(["sent", "delivered", "failed", "revoked"]),
  at: z.iso.datetime(),
});
