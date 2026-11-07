/**
 * Stackra file contract:
 * Purpose: `PAIRING_PICKUP_SCHEMA`, the zod schema of the hub's answer to `POST /device-pairings/:pairingId/pickup`:
 *          the registered id and the access token, handed over once to the holder of the pairing secret.
 * Boundary: internal; the trust boundary of the pairing driver. A malformed body throws `ZodError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0235 (decision 1, as amended); ADR 0095 as amended.
 */
import { z } from "zod";

/** The picked-up credential. */
export const PAIRING_PICKUP_SCHEMA = z.object({
  deviceId: z.string().min(1),
  token: z.string().min(1),
});
