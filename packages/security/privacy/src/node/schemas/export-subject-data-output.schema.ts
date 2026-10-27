/**
 * Stackra file contract:
 * Purpose: `ExportSubjectDataOutput`, the output of the `privacy.subject.export@1` job: where the zip is, its signed
 *          link, when the link expires and how many records it holds.
 * Boundary: a shape class implementing `SubjectExportLink`; it registers its schema when the module loads (STA-339
 *           replaces the registration). The link is the only way to the data; the request flow hands it to the person.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 1); ADR 0294 (decisions 4 and 13); STA-1375.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import type { SubjectExportLink } from "#core/types/subject-export-link.type";

/** A written export. */
export class ExportSubjectDataOutput extends Schema implements SubjectExportLink {
  /** How many records the zip holds. */
  @Int({ min: 0 })
  records!: number;

  /** The zip's path on the host disk. */
  path!: string;

  /** The signed link to the zip. */
  url!: string;

  /** When the link expires, ISO 8601. */
  expiresAt!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ExportSubjectDataOutput,
    z.object({
      path: z.string().min(1),
      url: z.string().min(1),
      expiresAt: z.string(),
      records: z.number().int().min(0),
    }),
  ],
]);
