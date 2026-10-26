/**
 * Stackra file contract:
 * Purpose: `IMPORT_MAPPING_PROFILE_SCHEMA`, the shape of an import mapping profile as a product's seed pack (or a
 *          tenant's saved profile) holds it: a key and, per sheet, the target it feeds and its column mapping.
 * Boundary: mechanism only. The profiles themselves are data in each product's seed pack (`products and variants`,
 *           grocery `items, PLU, barcodes, scale layouts`); the order of `sheets` is the order the targets depend on.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 1); config-model (configuration, not code); ADR 0367 (decision 5).
 */
import { z } from "zod";

/**
 * The import mapping profile schema.
 *
 * @example
 * const profile = IMPORT_MAPPING_PROFILE_SCHEMA.parse(seedRow.value);
 */
export const IMPORT_MAPPING_PROFILE_SCHEMA = z.object({
  key: z.string().min(1),
  sheets: z
    .array(
      z.object({
        sheet: z.string(),
        target: z.string().min(1),
        mapping: z.record(z.string(), z.string()),
      }),
    )
    .min(1),
});
