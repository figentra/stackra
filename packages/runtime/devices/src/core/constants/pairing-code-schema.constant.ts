/**
 * Stackra file contract:
 * Purpose: `PAIRING_CODE_SCHEMA`, the zod schema of the hub's answer to `POST /device-pairings`: the pairing id, the
 *          code to show and its expiry decoded into a `Date`.
 * Boundary: internal; the trust boundary of the pairing driver. Unknown keys are dropped; a malformed body throws
 *           `ZodError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 7); ADR 0095 as amended (zod at the boundary).
 */
import { isoDateTime } from "@stackra/validation";
import { z } from "zod";

/** The opened pairing. */
export const PAIRING_CODE_SCHEMA = z.object({
  pairingId: z.string().min(1),
  code: z.string().min(1),
  expiresAt: isoDateTime(),
});
