/**
 * Stackra file contract:
 * Purpose: `PAGE_CONTEXT_SELECTION_SCHEMA`, the zod schema of a page's selection: at most 200 selected ids, the count
 *          of the whole selection and the filter when "everything matching" is selected.
 * Boundary: the stand-in for what gen writes for this package; internal, registered by `PageContextSelection`.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 5: at most 200 selection ids); STA-1631.
 */
import { z } from "zod";

import { ANY_PUBLIC_ID_SCHEMA } from "#core/constants/any-public-id-schema.constant";
import { PAGE_FILTER_VALUES_SCHEMA } from "#core/constants/page-filter-values-schema.constant";

/** The shipped `PageContextSelection$`; a larger selection sends its count and filter. */
export const PAGE_CONTEXT_SELECTION_SCHEMA = z.object({
  ids: z.array(ANY_PUBLIC_ID_SCHEMA).max(200),
  count: z.number().int().min(0),
  filter: PAGE_FILTER_VALUES_SCHEMA.exactOptional(),
});
