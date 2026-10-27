/**
 * Stackra file contract:
 * Purpose: `LoginDirectoryConfig`, the configuration of the login directory writer (key `login_directory`): the region
 *          this deployment writes for, the id of the active hash key and the hash key itself.
 * Boundary: a configuration class over `LoginDirectoryOptions` with no env map; runway's `config.login_directory`
 *           layer sets the region and key id per regional deployment, and the `IDENTITY_LOGIN_DIRECTORY_KEY` secret
 *           comes from the secret store. Read by `LoginDirectoryWriterService` only; server only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0173; ADR 0353 (decision 4); ADR 0451.
 */
import { Config } from "@stackra/config";

import { LoginDirectoryOptions } from "#core/schemas/login-directory-options.schema";

/**
 * The login directory writer configuration.
 *
 * @example
 * import { LoginDirectoryConfig as BaseLoginDirectoryConfig } from "@stackra/identity";
 *
 * export class LoginDirectoryConfig extends BaseLoginDirectoryConfig {
 *   override keyId = "k2026-10";
 * }
 */
export class LoginDirectoryConfig extends Config({ schema: LoginDirectoryOptions }) {}
