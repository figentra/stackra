/**
 * Stackra file contract:
 * Purpose: `FilesystemConfig`, the disk configuration (key `filesystem`): the `disk` driver choice runway sets per
 *          environment (`local` in dev, `s3` in preview, staging and production) and what each driver reads.
 * Boundary: a configuration class over `FilesystemOptions` with no env map; runway's `config.filesystem` layer sets
 *           it. A host overrides it as `class FilesystemConfig extends BaseFilesystemConfig` with `override` members
 *           only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1).
 */
import { Config } from "@stackra/config";

import { FilesystemOptions } from "#core/schemas/filesystem-options.schema";

/**
 * The disk configuration.
 *
 * @example
 * import { FilesystemConfig as BaseFilesystemConfig } from "@stackra/filesystem";
 *
 * export class FilesystemConfig extends BaseFilesystemConfig {
 *   override url: string | null = "https://cdn.acme.test/files";
 * }
 */
export class FilesystemConfig extends Config({ schema: FilesystemOptions }) {}
