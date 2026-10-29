/**
 * Stackra file contract:
 * Purpose: `EXPORT_INPUT_SCHEMA`, the shipped zod form of `ExportInput`: the file format, the dotted row paths, and the
 *          list query's filters, sort and search.
 * Boundary: a constant in its own file, so `ExportInput`'s `@Field` hatches import it and the generated schema can too
 *           (a hatch cannot carry a binding declared beside the class, `shape_hatch_local_binding`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 4 and 10); ADR 0163 (decision 4); reporting gap 11.
 */
import { Enum, SortDirection } from "@stackra/contracts";
import { z } from "zod";

import { ExportFormat } from "#core/enums/export-format.enum";

/** A dotted row path. */
const PATH = z
  .string()
  .regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/, "must be a row path");

/** The shipped schema of `ExportInput`. */
export const EXPORT_INPUT_SCHEMA = z.object({
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
