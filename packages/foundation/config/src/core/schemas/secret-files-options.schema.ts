/**
 * Stackra file contract:
 * Purpose: `SecretFilesOptions`, the shape of `SecretFilesConfig`: the folder the `file` secret store reads, one file
 *          per secret named by the secret (`/run/secrets/RESEND_API_KEY`), and optionally which names it must hold.
 * Boundary: a shape class; it registers this package's own schema (`SECRET_FILES_CONFIG_SCHEMA`) for itself when the
 *           module loads. The folder is where the platform mounts its secrets (a Kubernetes Secret volume, Docker or
 *           Compose secrets, a systemd credential directory); no value is configured anywhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0371 (amendment 2026-11-27, STA-258); ADR 0173; ADR 0294 (decisions 19 and 26).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { SECRET_FILES_CONFIG_SCHEMA } from "#core/constants/secret-files-config-schema.constant";

/**
 * The `file` store's settings.
 *
 * @example
 * export class SecretFilesConfig extends BaseSecretFilesConfig {
 *   override directory = "/run/secrets";
 * }
 */
export class SecretFilesOptions extends Schema {
  /** The absolute folder holding one file per secret; the store refuses to load while it is empty. */
  directory = "";

  /**
   * The names the folder must hold, each a file; a missing one fails the load. Empty reads every SCREAMING_SNAKE
   * file in the folder, so a platform's own files (`..data`, dotfiles) are skipped.
   */
  names: string[] = [];
}

registerSchemas([[SecretFilesOptions, SECRET_FILES_CONFIG_SCHEMA]]);
