/**
 * Stackra file contract:
 * Purpose: `DocumentsConfig`, the documents configuration (key `documents`): where the `gotenberg` drivers reach the
 *          engine, the time a call may take and the secret `authorization` header.
 * Boundary: a configuration class over `DocumentsOptions` with no env map; runway's `config.documents` layer sets the
 *           URL per region, the secret store the header. A host overrides it as `class DocumentsConfig extends
 *           BaseDocumentsConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 17, 19 and 20); ADR 0296 (decision 1); ADR 0365 (decision 2).
 */
import { Config } from "@stackra/config";

import { DocumentsOptions } from "#core/schemas/documents-options.schema";

/**
 * The documents configuration.
 *
 * @example
 * import { DocumentsConfig as BaseDocumentsConfig } from "@stackra/documents";
 *
 * export class DocumentsConfig extends BaseDocumentsConfig {
 *   override gotenbergTimeoutMs = 60_000;
 * }
 */
export class DocumentsConfig extends Config({ schema: DocumentsOptions }) {}
