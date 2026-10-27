/**
 * Stackra file contract:
 * Purpose: `DocumentsOptions`, the shape of `DocumentsConfig`: the Gotenberg engine's base URL, the longest a call may
 *          take, and the `authorization` header it needs.
 * Boundary: a shape class; it registers this package's own schema (`DOCUMENTS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(DocumentsConfig)` validates with no generated file. The engine's URL is
 *           runway's value per region; the header carries basic auth, so it is the `DOCUMENTS_GOTENBERG_AUTHORIZATION`
 *           secret, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0365 (decision 2); ADR 0173.
 */
import { Secret } from "@stackra/config";
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { DOCUMENTS_CONFIG_SCHEMA } from "#core/constants/documents-config-schema.constant";

/**
 * The documents settings.
 *
 * @example
 * export class DocumentsConfig extends BaseDocumentsConfig {
 *   override gotenbergUrl = "http://gotenberg.ksa.internal:3000";
 * }
 */
export class DocumentsOptions extends Schema {
  /** The `authorization` header the engine needs (`Basic …`); empty sends none. */
  @Secret("DOCUMENTS_GOTENBERG_AUTHORIZATION")
  gotenbergAuthorization = "";

  /** The longest one engine call may take, in milliseconds, before it is abandoned. */
  @Int({ min: 1 })
  gotenbergTimeoutMs = 30_000;

  /** The Gotenberg engine's base URL the `gotenberg` drivers post to. */
  gotenbergUrl = "http://127.0.0.1:3000";
}

registerSchemas([[DocumentsOptions, DOCUMENTS_CONFIG_SCHEMA]]);
