/**
 * Stackra file contract:
 * Purpose: `PageContextSelection`, what a page publishes about the rows the user selected: at most 200 ids, how many
 *          rows are selected in all, and the filter when "everything matching" is selected.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. Ids only, never row
 *           values; the server drops any id the caller cannot read (ADR 0490 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 5 and 6); ADR 0305 (one declaration per file); STA-1631.
 */
import type { PublicId } from "@stackra/contracts";
import { Int, List, registerSchemas, Schema } from "@stackra/validation";

import { PAGE_CONTEXT_SELECTION_SCHEMA } from "#core/constants/page-context-selection-schema.constant";

/**
 * The selection of one page.
 *
 * @example
 * PageContextSelection.create({ ids: ["ord_01H2J3K4L5M6N7P8Q9R0S1T2V3"], count: 1 });
 */
export class PageContextSelection extends Schema {
  /** The selected rows' public ids, at most 200. */
  @List({ max: 200 })
  ids!: PublicId[];

  /** How many rows are selected in all; larger than `ids` when the selection was cut. */
  @Int
  count!: number;

  /** The filter of "everything matching", by declared filter key. */
  filter?: Record<string, string | number | boolean | string[]>;
}

registerSchemas([[PageContextSelection, PAGE_CONTEXT_SELECTION_SCHEMA]]);
