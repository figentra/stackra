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
import { Enum, SortDirection } from "@stackra/contracts";
import { Field, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { ExportFormat } from "#core/enums/export-format.enum";

/** A dotted row path. */
const PATH = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/, "must be a row path");

/** The shipped schema of `ExportInput`. */
const EXPORT_INPUT_SCHEMA = z.object({
  format: z.enum(Enum.values(ExportFormat)),
  columns: z.array(PATH).min(1).max(200),
  filters: z.record(z.string(), z.unknown()).default(() => ({})),
  sort: z
    .union([
      z.object({ key: PATH, direction: z.enum(Enum.values(SortDirection)) }),
      z.array(z.object({ key: PATH, direction: z.enum(Enum.values(SortDirection)) })).max(3),
    ])
    .exactOptional(),
  search: z.string().max(200).exactOptional(),
});

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
