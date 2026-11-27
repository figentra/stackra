/**
 * Stackra file contract:
 * Purpose: `GcpSecretManagerConfig`, the configuration of the Google Secret Manager secret store (key
 *          `config.gcp_secret_manager`): the project, location, secret ids and request timeout.
 * Boundary: a configuration class over `GcpSecretManagerOptions` with no env map; runway's layer sets it per
 *           environment. No credential: the runtime's own service account signs the reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0371 (amendment 2026-11-27).
 */
import { Config } from "#core/bases/config.base";
import { GcpSecretManagerOptions } from "#core/schemas/gcp-secret-manager-options.schema";

/**
 * The Google Secret Manager store's configuration.
 *
 * @example
 * const config = buildConfig(GcpSecretManagerConfig, { values: { project: "acme-staging", secretIds: ["API_KEY"] } });
 */
export class GcpSecretManagerConfig extends Config({ schema: GcpSecretManagerOptions }) {}
