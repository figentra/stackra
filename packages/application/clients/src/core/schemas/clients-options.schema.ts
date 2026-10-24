/**
 * Stackra file contract:
 * Purpose: `ClientsOptions`, the fields of `ClientsConfig`: where the HTTP transport sends calls, the API version it
 *          pins, how long a request may take and how many attempts a safe call gets.
 * Boundary: a schema class whose initializers equal the shipped schema's defaults; the schema is registered here until
 *           gen compiles it. A host overrides fields in `src/config/clients.config.ts`.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (config classes); ADR 0294 (decision 26: one shape, one schema).
 */
import { registerSchemas, Schema } from "@stackra/validation";

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
  /** The API origin the HTTP transport joins each route to; empty means the page's own origin. */
  baseUrl = "";

  /** The dated API version sent as `Stackra-Version`; empty sends none, so the producer serves its newest. */
  apiVersion = "";

  /** Seconds one request may take before it fails as a timeout. */
  timeoutSeconds = 30;

  /** Attempts of a call that is safe to repeat, the first included. */
  attempts = 3;
}

registerSchemas([[ClientsOptions, CLIENTS_CONFIG_SCHEMA]]);
