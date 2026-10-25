/**
 * Stackra file contract:
 * Purpose: `DEVICE_COMMAND_LIST_SCHEMA`, the zod schema of the hub's `GET /device-commands` body: `{ items }`, each a
 *          `DeviceCommand` with its instants decoded from ISO 8601 into `Date`.
 * Boundary: internal to the package; the trust boundary of the commands driver, which parses every body with it.
 *           Unknown keys are dropped; a missing or malformed field throws `ZodError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 2); ADR 0095 as amended (zod at the boundary).
 */
import { isoDateTime, json } from "@stackra/validation";
import { z } from "zod";

/** The pending-commands body. */
export const DEVICE_COMMAND_LIST_SCHEMA = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      payload: z.record(z.string(), json()),
      issuedAt: isoDateTime(),
      expiresAt: isoDateTime().nullable(),
    }),
  ),
});
