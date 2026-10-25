/**
 * Stackra file contract:
 * Purpose: `PRODUCT_SCHEMA`, the `product` section of the root `runway.yaml`: the product's registry key and, for an
 *          edition, the base product it is made of (`edition.of`) and the range of base versions it accepts.
 * Boundary: internal; the root runway schema and the runway facts schema compose it. Shape only: whether the base key
 *           and version range match a released base manifest is the registry check (STA-339).
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 2: the edition is declared once, in the root runway); ADR 0296 (the root
 *                     runway's `product` section).
 */
import { z } from "zod";

/** `{ key: "fashion", edition: { of: "commerce", version: "^1.0.0" } }`; a product with no `edition` is a base. */
export const PRODUCT_SCHEMA = z.strictObject({
  key: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case product key"),
  edition: z
    .strictObject({
      of: z.string().regex(/^[a-z][a-z0-9-]*$/, "Expected a lower-case product key"),
      version: z.string().min(1),
    })
    .optional(),
});
