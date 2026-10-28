/**
 * Stackra file contract:
 * Purpose: `ExportOutput`, what a finished queued export answers: the signed download link, when it expires, how many
 *          rows were written and whether the row cap cut the file short.
 * Boundary: a shape class. The link is a disk-signed URL valid for 24 hours (ADR 0307 rule 10); its issue is
 *           access-logged against the reader.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 10); ADR 0163 (decision 4); reporting gap 11.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** One finished export. */
export class ExportOutput extends Schema {
  /** The data rows written. */
  @Int({ min: 0 })
  rows!: number;

  /** The signed download link. */
  link!: string;

  /** When the link stops working, ISO 8601. */
  expiresAt!: string;

  /** True when more rows matched than the configured cap allowed. */
  truncated!: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ExportOutput,
    z.object({
      link: z.string().min(1),
      expiresAt: z.string().min(1),
      rows: z.number().int().min(0),
      truncated: z.boolean(),
    }),
  ],
]);
