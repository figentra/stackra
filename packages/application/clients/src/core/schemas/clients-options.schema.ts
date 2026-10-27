/**
 * Stackra file contract:
 * Purpose: `ClientsOptions`, the fields of `ClientsConfig`: where the HTTP transport sends calls (one base URL, and
 *          one per producer module), the header a call's scope travels in, the API version it pins, how long a request may take and how many attempts a safe call gets.
 * Boundary: a schema class whose initializers equal the shipped schema's defaults; the schema is registered here until
 *           gen compiles it. A host overrides fields in `src/config/clients.config.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (config classes); ADR 0294 (decision 26: one shape, one schema).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { CLIENTS_CONFIG_SCHEMA } from "#core/constants/clients-config-schema.constant";

/**
 * The generated-client settings of a host.
 *
 * @example
 * export class ClientsConfig extends BaseClientsConfig {
 *   override baseUrl = "https://api.acme.example";
 *   override apiVersion = "2027-03-01";
 * }
 */
export class ClientsOptions extends Schema {
  /** Seconds one request may take before it fails as a timeout. */
  @Int
  timeoutSeconds = 30;

  /** Attempts of a call that is safe to repeat, the first included. */
  @Int
  attempts = 3;

  /** The API origin the HTTP transport joins each route to; empty means the page's own origin. */
  baseUrl = "";

  /** The base URL per producer module key (`{ orders: "https://orders.internal" }`); a module not listed uses `baseUrl`. */
  producers: Readonly<Record<string, string>> = {};

  /** The header a call's explicit scope path travels in; `@stackra/scope` reads `X-Scope-Path` (`SCOPE_PATH_HEADER`). */
  scopeHeader = "X-Scope-Path";

  /** The dated API version sent as `Stackra-Version`; empty sends none, so the producer serves its newest. */
  apiVersion = "";
}

registerSchemas([[ClientsOptions, CLIENTS_CONFIG_SCHEMA]]);
