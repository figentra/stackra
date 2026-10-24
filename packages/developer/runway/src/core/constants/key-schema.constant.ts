/**
 * Stackra file contract:
 * Purpose: `KEY_SCHEMA`, the spelling of a member key, a topology group name or a resource, queue or bucket name in a
 *          runway: lower case, starting with a letter, then letters, digits, `-` or `_`.
 * Boundary: internal; the runway schemas compose it. It checks spelling only; whether a member exists is
 *           `checkPlacement`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: member keys from folder names), ADR 0231.
 */
import { z } from "zod";

/** `commerce`, `payments-ledger`, `product_images`. */
export const KEY_SCHEMA = z.string().regex(/^[a-z][a-z0-9_-]*$/, "Expected a lower-case key");
