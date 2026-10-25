/**
 * Stackra file contract:
 * Purpose: `KEY_SCHEMA`, the spelling of a member key or a dev infra service name in the resolved runway facts:
 *          lower case, starting with a letter, then letters, digits, `-` or `_`.
 * Boundary: internal; the facts schema composes it. The runway files themselves follow the canonical schemas, which
 *           leave these names open; whether a member exists is `checkPlacement`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: member keys from folder names), ADR 0231.
 */
import { z } from "zod";

/** `commerce`, `payments-ledger`, `product_images`. */
export const KEY_SCHEMA = z.string().regex(/^[a-z][a-z0-9_-]*$/, "Expected a lower-case key");
