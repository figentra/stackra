/**
 * Stackra file contract:
 * Purpose: `ExportInput`, what a queued export of a resource list is asked for: the file format, the row paths written
 *          in order, and the list's current filters, sort and search.
 * Boundary: a shape class. The filters, sort and search are the list query's closed input (`tableInput`'s output), passed
 *           to the list query as they are, so the query's own input schema checks them; nothing here widens what the
 *           list may read. Columns are dotted row paths.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 4 and 10); ADR 0163 (decision 4); reporting gap 11.
 */
import type { SortDirection } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";

import type { ExportFormat } from "#core/enums/export-format.enum";
import { EXPORT_INPUT_SCHEMA } from "#node/constants/export-input-schema.constant";

/** One queued export request. */
export class ExportInput extends Schema {
  /** The file format. */
  // reason: the closed set of `ExportFormat` codes
  @Field(EXPORT_INPUT_SCHEMA.shape.format)
  format!: ExportFormat;

  /** The row paths written, in order; `@Classified` ones are dropped unless opted in. */
  // reason: a list of row paths; the shipped schema says it
  @Field(EXPORT_INPUT_SCHEMA.shape.columns)
  columns!: string[];

  /** The list's filter values, in their wire form. */
  // reason: free filter values keyed by row path; the list query's input checks them
  @Field(EXPORT_INPUT_SCHEMA.shape.filters.unwrap())
  filters: Record<string, unknown> = {};

  /** The list's sort, one key or up to three. */
  // reason: the list query's sort shape; the shipped schema says it
  @Field(EXPORT_INPUT_SCHEMA.shape.sort.unwrap())
  sort?: { key: string; direction: SortDirection } | { key: string; direction: SortDirection }[];

  /** The list's search text. */
  search?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ExportInput, EXPORT_INPUT_SCHEMA]]);
