/**
 * Stackra file contract:
 * Purpose: `PAIRING_STATUS_SCHEMA`, the zod schema of the hub's answer to `GET /device-pairings/:pairingId`: the
 *          state, the registered id once paired, and the access token the hub hands the device once, when paired.
 * Boundary: internal; the trust boundary of the pairing driver. A paired answer must carry the device id and the token;
 *           any other answer carries neither.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0095 as amended.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { PairingState } from "#contracts/enums/pairing-state.enum";

/** The pairing's state, with the credential once paired. */
export const PAIRING_STATUS_SCHEMA = z
  .object({
    state: z.enum(Enum.values(PairingState)),
    deviceId: z.string().min(1).nullable(),
    token: z.string().min(1).nullable(),
  })
  .refine(
    (status) =>
      status.state === PairingState.Paired
        ? status.deviceId !== null && status.token !== null
        : status.token === null,
    {
      message:
        "a paired answer carries the device id and the token; no other answer carries a token",
    },
  );
