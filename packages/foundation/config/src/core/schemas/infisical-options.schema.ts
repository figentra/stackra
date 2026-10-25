/**
 * Stackra file contract:
 * Purpose: `InfisicalOptions`, the shape of `InfisicalConfig`: which Infisical instance, project, environment and folder
 *          the `infisical` secret store reads, and the machine identity it signs in with.
 * Boundary: a shape class; it registers this package's own schema (`INFISICAL_CONFIG_SCHEMA`) for itself when the
 *           module loads. The machine identity's client id and secret are secrets by name, resolved from the platform's
 *           own store (an Encore secret, a Worker binding) when the configuration is built: the bootstrap credential
 *           that unlocks the rest. No instance is assumed: the site URL is empty until a deployment sets it.
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (secrets by name, nobody reads a value); ADR 0146 as amended; ADR 0294 (decisions 19
 *                     and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { INFISICAL_CONFIG_SCHEMA } from "#core/constants/infisical-config-schema.constant";
import { Secret } from "#core/decorators/secret.decorator";

/**
 * The Infisical secret store's settings.
 *
 * @example
 * export class InfisicalConfig extends BaseInfisicalConfig {
 *   override siteUrl = "https://secrets.example.test";
 *   override projectId = "prj-123";
 *   override environment = "staging";
 * }
 */
export class InfisicalOptions extends Schema {
  /** The Infisical instance (`https://secrets.example.test`); the store refuses to load while it is empty. */
  siteUrl = "";

  /** The project (workspace) id the secrets belong to. */
  projectId = "";

  /** The environment slug (`dev`, `staging`, `prod`). */
  environment = "";

  /** The folder read, `/` for the root; its subfolders are not read. */
  path = "/";

  /** The machine identity's client id (universal auth). */
  @Secret("INFISICAL_CLIENT_ID")
  clientId = "";

  /** The machine identity's client secret (universal auth). */
  @Secret("INFISICAL_CLIENT_SECRET")
  clientSecret = "";
}

registerSchemas([[InfisicalOptions, INFISICAL_CONFIG_SCHEMA]]);
