/**
 * Stackra file contract:
 * Purpose: `ClientsConfig`, the configuration keyed `clients` over `ClientsOptions`, read by the HTTP transport driver.
 * Boundary: a config class; a host overrides it in `src/config/clients.config.ts` and maps its own environment
 *           variable to `baseUrl` (`VITE_API_URL`, `EXPO_PUBLIC_API_URL`), since the prefix depends on the target.
 * Runtime: isomorphic
 * Governing contract: ADR 0146 (config classes, as amended by 0294 and 0305); ADR 0306 (overrides keep the plain name).
 */
import { Config } from "@stackra/config";

import { ClientsOptions } from "#core/schemas/clients-options.schema";

/**
 * A host's generated-client configuration.
 *
 * @example
 * import { ClientsConfig as BaseClientsConfig } from "@stackra/clients";
 *
 * export class ClientsConfig extends BaseClientsConfig {
 *   override baseUrl = "https://api.acme.example";
 * }
 */
export class ClientsConfig extends Config({ schema: ClientsOptions }) {}
