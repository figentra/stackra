/**
 * Stackra file contract:
 * Purpose: `PAGE_CONTEXT_SCHEMA`, the zod schema of `PageContext`: the app, the route, its params, and the optional
 *          record, selection, filters, view and modal.
 * Boundary: the stand-in for what gen writes for this package; internal, registered by `PageContext`. It holds public
 *           ids and declared keys, never a record's field values (ADR 0490 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 5); STA-1631.
 */
import { z } from "zod";

import { ANY_PUBLIC_ID_SCHEMA } from "#core/constants/any-public-id-schema.constant";
import { PAGE_CONTEXT_MODAL_SCHEMA } from "#core/constants/page-context-modal-schema.constant";
import { PAGE_CONTEXT_SELECTION_SCHEMA } from "#core/constants/page-context-selection-schema.constant";
import { PAGE_FILTER_VALUES_SCHEMA } from "#core/constants/page-filter-values-schema.constant";

/** The shipped `PageContext$`. */
export const PAGE_CONTEXT_SCHEMA = z.object({
  app: z.string().min(1).max(64),
  route: z.string().min(1).max(200),
  params: z.record(z.string().min(1).max(100), z.string().max(200)),
  record: ANY_PUBLIC_ID_SCHEMA.exactOptional(),
  selection: PAGE_CONTEXT_SELECTION_SCHEMA.exactOptional(),
  filters: PAGE_FILTER_VALUES_SCHEMA.exactOptional(),
  view: z.string().min(1).max(100).exactOptional(),
  modal: PAGE_CONTEXT_MODAL_SCHEMA.exactOptional(),
});
