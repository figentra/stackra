/**
 * Stackra file contract:
 * Purpose: `SearchOptions`, the shape of `SearchConfig`: which search driver runs.
 * Boundary: a shape class; it registers this package's own schema (`SEARCH_CONFIG_SCHEMA`) for itself when the module
 *           loads, so `buildConfig(SearchConfig)` validates with no generated file. Deploy-time values only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0305 (rule 34); ADR 0221 (decision 9: engines behind one
 *                     interface).
 */
import "#core/types/search-driver-names.type";

import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import type { SearchDriver } from "#contracts/ports/search-driver.port";
import { SEARCH_CONFIG_SCHEMA } from "#core/constants/search-config-schema.constant";

/**
 * The search settings.
 *
 * @example
 * export class SearchConfig extends BaseSearchConfig {
 *   override driver: DriverName<SearchDriver> = "memory";
 * }
 */
export class SearchOptions extends Schema {
  /** Which driver runs: `postgres` keeps the index in the model's own table; `memory` keeps it in the process. */
  driver: DriverName<SearchDriver> = "postgres";

  /**
   * The in-region embeddings endpoint `HttpEmbedderDriver` calls (an OpenAI-compatible `/embeddings` API: a model
   * served in the tenant's region, so text never leaves it). Which provider and region is runway's value per
   * environment; no credential is a field, only the name of the environment variable that holds the token.
   */
  embedder: {
    /** The endpoint base URL (`https://embed.me-central-1.acme.internal/v1`); `null` while none is configured. */
    url: string | null;
    /** The model the endpoint serves (a multilingual model that reads Arabic). */
    model: string;
    /** The vector size the model returns, which the vector index was created with. */
    dimensions: number;
    /** The environment variable holding the bearer token; `null` for an endpoint inside the network that needs none. */
    tokenEnv: string | null;
  } = { url: null, model: "", dimensions: 1024, tokenEnv: null };
}

registerSchemas([[SearchOptions, SEARCH_CONFIG_SCHEMA]]);
