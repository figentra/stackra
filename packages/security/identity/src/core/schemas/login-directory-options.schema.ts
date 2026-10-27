/**
 * Stackra file contract:
 * Purpose: `LoginDirectoryOptions`, the shape of `LoginDirectoryConfig`: the region key this deployment writes its
 *          directory rows for, the active hash key's id and the hash key.
 * Boundary: a shape class; it registers this package's own schema (`LOGIN_DIRECTORY_CONFIG_SCHEMA`) when the module
 *           loads. The region keys are the deployment's (ADR 0353 decision 1); the key is the
 *           `IDENTITY_LOGIN_DIRECTORY_KEY` secret, the same value the directory Worker holds as its secret, read from
 *           the secret store. Server only: never part of a browser build.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 26); ADR 0173; ADR 0353 (decisions 1 and 4); ADR 0451.
 */
import { Secret } from "@stackra/config";
import { registerSchemas, Schema } from "@stackra/validation";

import { LOGIN_DIRECTORY_CONFIG_SCHEMA } from "#core/constants/login-directory-config-schema.constant";

/**
 * The login directory writer settings.
 *
 * @example
 * export class LoginDirectoryConfig extends BaseLoginDirectoryConfig {
 *   override region = "eu";
 * }
 */
export class LoginDirectoryOptions extends Schema {
  /** The HMAC key; empty until the secret is set. */
  @Secret("IDENTITY_LOGIN_DIRECTORY_KEY")
  secret = "";

  /** The region key this deployment writes for (`eu`, `me-central`); empty until runway sets it. */
  region = "";

  /** The active hash key's id (`k2026-10`); empty until runway sets it. */
  keyId = "";
}

registerSchemas([[LoginDirectoryOptions, LOGIN_DIRECTORY_CONFIG_SCHEMA]]);
