/**
 * Stackra file contract:
 * Purpose: `EXPORT_CONFIG_SCHEMA`, the zod schema of the queued export's configuration (`ExportConfig$`): the rows read
 *          per list page, the most rows one file holds, the disk folder, and the page a PDF table is printed on.
 * Boundary: the stand-in for what gen will write for this package. Defaults only; a host or runway layer overrides them.
 *           The link's 24-hour life is ADR 0307 rule 10's, not configuration.
 * Runtime: isomorphic
 * Governing contract: ADR 0363 (configuration, not code); ADR 0307 (rule 10); reporting gap 11.
 */
import { z } from "zod";

/** The shipped `ExportConfig$`. */
export const EXPORT_CONFIG_SCHEMA = z.object({
  pageSize: z.number().int().min(1).max(5000).default(500),
  maxRows: z.number().int().min(1).default(100_000),
  folder: z.string().min(1).default("exports"),
  pdfPage: z
    .object({
      widthMm: z.number().positive(),
      heightMm: z.number().positive().exactOptional(),
      marginMm: z.number().min(0),
    })
    .default(() => ({ widthMm: 297, heightMm: 210, marginMm: 10 })),
  pdfMaxRows: z.number().int().min(1).default(5000),
});
