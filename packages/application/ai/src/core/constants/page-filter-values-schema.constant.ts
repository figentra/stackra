/**
 * Stackra file contract:
 * Purpose: `PAGE_FILTER_VALUES_SCHEMA`, the zod schema of the filters a page publishes: declared filter keys to the
 *          value the user set (text, number, flag or a short list of text).
 * Boundary: internal, shared by `PageContext` and its selection. The keys are the page's declared filter keys; a value
 *           is what the user typed into a filter, never a record's field value (ADR 0490 decision 5). Sizes are
 *           bounded so a context stays small.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 5 and 6); STA-1631.
 */
import { z } from "zod";

/** The shipped filters schema of a page context. */
export const PAGE_FILTER_VALUES_SCHEMA = z.record(
  z.string().min(1).max(100),
  z.union([z.string().max(200), z.number(), z.boolean(), z.array(z.string().max(200)).max(50)]),
);
