/**
 * Stackra file contract:
 * Purpose: `SecretFilesConfig`, the configuration of the `file` secret store (key `config.secret_files`): the folder
 *          of mounted secret files and the names it must hold.
 * Boundary: a configuration class over `SecretFilesOptions` with no env map; runway's layer sets it per environment.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0371 (amendment 2026-11-27).
 */
import { Config } from "#core/bases/config.base";
import { SecretFilesOptions } from "#core/schemas/secret-files-options.schema";

/**
 * The `file` store's configuration.
 *
 * @example
 * const config = buildConfig(SecretFilesConfig, { values: { directory: "/run/secrets" } });
 */
export class SecretFilesConfig extends Config({ schema: SecretFilesOptions }) {}
