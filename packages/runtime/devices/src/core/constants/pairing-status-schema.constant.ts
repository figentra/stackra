/**
 * Stackra file contract:
 * Purpose: `PAIRING_STATUS_SCHEMA`, the zod schema of the hub's answer to `GET /device-pairings/:pairingId`: the
 *          state and the registered id once paired. Never a credential: the device picks that up once, with its
 *          pairing secret, from `POST /device-pairings/:pairingId/pickup` (`PAIRING_PICKUP_SCHEMA`).
 * Boundary: internal; the trust boundary of the pairing driver. A paired answer must carry the device id. Unknown keys
 *           are dropped, so a `token` a hub might still send never reaches the driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0095 as amended.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { PairingState } from "#contracts/enums/pairing-state.enum";

/** The pairing's state. */
export const PAIRING_STATUS_SCHEMA = z
  .object({
    state: z.enum(Enum.values(PairingState)),
    deviceId: z.string().min(1).nullable(),
  })
  .refine((status) => status.state !== PairingState.Paired || status.deviceId !== null, {
    message: "a paired answer carries the device id",
  });
