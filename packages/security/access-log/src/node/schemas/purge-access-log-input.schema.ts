/**
 * Stackra file contract:
 * Purpose: `PurgeAccessLogInput`, the input of the `access_log.access_log_entry.purge@1` job: no fields, because the
 *          cutoff comes from `AccessLogConfig.retentionDays`, never from the caller.
 * Boundary: a shape class in its own file; it registers its empty schema when the module loads, so the pipeline and
 *           `create` validate with no generated file (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0328.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/** No fields. */
export class PurgeAccessLogInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PurgeAccessLogInput, z.object({})]]);
