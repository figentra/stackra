/**
 * Stackra file contract:
 * Purpose: `PurgeSubjectExportsInput`, the input of the `privacy.subject_export.purge@1` job: no fields, because the
 *          window comes from `PrivacyConfig.exportTtlDays`, never from the caller.
 * Boundary: a shape class in its own file; it registers its empty schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0189 (decision 1); ADR 0294 (decisions 4 and 13); STA-1375.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** The input of an export purge, which takes no fields. */
export class PurgeSubjectExportsInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PurgeSubjectExportsInput, z.object({})]]);
