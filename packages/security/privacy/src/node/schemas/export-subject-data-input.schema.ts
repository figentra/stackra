/**
 * Stackra file contract:
 * Purpose: `ExportSubjectDataInput`, the input of the `privacy.subject.export@1` job: the subject whose data is
 *          exported.
 * Boundary: a shape class in its own file; it registers its schema when the module loads (STA-339 replaces the
 *           registration). The export window comes from `PrivacyConfig`, never from the caller.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 1); ADR 0294 (decisions 4 and 13); STA-1375.
 */
import { registerSchemas, Schema, Str } from "@stackra/validation";
import { z } from "zod";

/** Whose data to export. */
export class ExportSubjectDataInput extends Schema {
  /** The public id of the person asking for their data. */
  @Str({
    min: 1,
    max: 120,
  })
  subject!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ExportSubjectDataInput, z.object({ subject: z.string().min(1).max(120) })]]);
