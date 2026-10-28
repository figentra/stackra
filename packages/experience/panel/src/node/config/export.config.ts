/**
 * Stackra file contract:
 * Purpose: `ExportConfig`, the queued export's configuration: rows per page, row caps, the disk folder and the PDF page.
 * Boundary: a configuration class over `ExportOptions`; runway's config layer sets values per environment, and a host
 *           overrides it with `override` members only. No field is read from the environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0363; ADR 0307 (rule 10).
 */
import { Config } from "@stackra/config";

import { ExportOptions } from "#node/schemas/export-options.schema";

/**
 * Read by `ExportRunner`.
 *
 * @example
 * export class ExportConfig extends BaseExportConfig { override maxRows = 50_000; }
 */
export class ExportConfig extends Config({ schema: ExportOptions }) {}
