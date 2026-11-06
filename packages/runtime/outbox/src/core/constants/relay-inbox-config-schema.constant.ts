/**
 * Stackra file contract:
 * Purpose: `RELAY_INBOX_CONFIG_SCHEMA`, the zod schema of `RelayInboxConfig`: the running environment and the public
 *          keys of each producer the consumer pins, per environment.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default; with no producer listed the
 *           inbox verifies nothing. Public facts only.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decisions 16 and 18, amendment of 2026-11-02); ADR 0294 (decision 26).
 */
import { z } from "zod";

/** The shipped `RelayInboxConfig$`. */
export const RELAY_INBOX_CONFIG_SCHEMA = z.object({
  environment: z.string().min(1).default("dev"),
  producers: z
    .record(
      z.string(),
      z.record(
        z.string(),
        z.array(z.object({ id: z.string().min(1), publicKey: z.string().min(1) })),
      ),
    )
    .default({}),
});
