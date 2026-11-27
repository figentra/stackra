/**
 * Stackra file contract:
 * Purpose: `GcpSecretManagerOptions`, the shape of `GcpSecretManagerConfig`: the Google Cloud project, the location of
 *          regional secrets (empty: global secrets), the secrets the `gcp_secret_manager` store reads at load, and how
 *          long one request may take.
 * Boundary: a shape class; it registers this package's own schema (`GCP_SECRET_MANAGER_CONFIG_SCHEMA`) for itself
 *           when the module loads. No credential: the driver asks the platform's metadata server for the runtime's
 *           own service-account token, so no key is configured anywhere. Which secrets a deployment reads is data
 *           (runway), never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (amendment 2026-11-27, STA-258); ADR 0173; ADR 0294 (decisions 19 and 26).
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";

import { GCP_SECRET_MANAGER_CONFIG_SCHEMA } from "#core/constants/gcp-secret-manager-config-schema.constant";

/**
 * The Google Secret Manager store's settings.
 *
 * @example
 * export class GcpSecretManagerConfig extends BaseGcpSecretManagerConfig {
 *   override project = "acme-staging";
 *   override location = "me-central2";
 *   override secretIds = ["RESEND_API_KEY", "app-json@4"];
 * }
 */
export class GcpSecretManagerOptions extends Schema {
  /** Milliseconds one request (the token or one secret) may take before the load fails (100 to 60,000). */
  @Int({
    min: 100,
    max: 60_000,
  })
  timeoutMs = 10_000;

  /** The project id the secrets live in (`acme-staging`); the store refuses to load while it is empty. */
  project = "";

  /**
   * The region of regional secrets (`me-central2`), read through that region's endpoint so the values never leave it
   * (ADR 0371 decision 5); empty reads global secrets.
   */
  location = "";

  /**
   * The secret ids read at load, each optionally `@<version>` (`latest` otherwise). A secret whose value is a JSON
   * object gives one secret per string member; any other value is one secret under the secret's id.
   */
  secretIds: string[] = [];
}

registerSchemas([[GcpSecretManagerOptions, GCP_SECRET_MANAGER_CONFIG_SCHEMA]]);
