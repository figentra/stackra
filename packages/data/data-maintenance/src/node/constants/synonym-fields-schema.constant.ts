/**
 * Stackra file contract:
 * Purpose: `SYNONYM_FIELDS`, the zod rules of a synonym set's three fields (index, language, terms), shared by the
 *          `Synonym` model and the synonym actions' schemas so the two never drift.
 * Boundary: data only, internal to this package. The index and language are the shapes `SEARCH_SYNONYM_LINE` reads (the
 *           data sets are turned into that line form when a read expands a phrase), so a term holds no comma, `#` or line
 *           break; two to sixteen terms, each at most 80 characters.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 5: the per-tenant synonym list); ADR 0403; ADR 0307 (rules 22 to 24).
 */
import { z } from "zod";

/** The rules of a synonym set's fields. */
export const SYNONYM_FIELDS = z.object({
  indexName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)?$/u),
  language: z.string().regex(/^[a-z]{2,3}$/u),
  terms: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(80)
        .regex(/^[^,#\n\r]+$/u),
    )
    .min(2)
    .max(16),
});
