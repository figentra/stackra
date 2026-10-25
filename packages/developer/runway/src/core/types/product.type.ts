/**
 * Stackra file contract:
 * Purpose: `Product`, the `product` section of the root runway: the product key and, for an edition, its base.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 2).
 */
import type { z } from "zod";

import type { PRODUCT_SCHEMA } from "#core/constants/product-schema.constant";

/** The product a root runway declares. */
export type Product = z.output<typeof PRODUCT_SCHEMA>;
