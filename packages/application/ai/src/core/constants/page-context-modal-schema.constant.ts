/**
 * Stackra file contract:
 * Purpose: `PAGE_CONTEXT_MODAL_SCHEMA`, the zod schema of the open action modal a page publishes: the action's key and
 *          the keys of the fields it shows.
 * Boundary: the stand-in for what gen writes for this package; internal, registered by `PageContextModal`. Keys only,
 *           never what the user typed (ADR 0490 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 5); STA-1631.
 */
import { z } from "zod";

/** The shipped `PageContextModal$`. */
export const PAGE_CONTEXT_MODAL_SCHEMA = z.object({
  action: z.string().min(1).max(200),
  fields: z.array(z.string().min(1).max(100)).max(100),
});
