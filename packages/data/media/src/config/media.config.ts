/**
 * Stackra file contract:
 * Purpose: `MediaConfig`, the media configuration (key `media`): the `disk` and `uploader` driver choices runway sets
 *          per environment, the upload lifetime and the upload endpoint.
 * Boundary: a configuration class over `MediaOptions` with no env map; runway's `config.media` layer sets it. A host
 *           overrides it as `class MediaConfig extends BaseMediaConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1).
 */
import { Config } from "@stackra/config";

import { MediaOptions } from "#core/schemas/media-options.schema";

/**
 * The media configuration.
 *
 * @example
 * import { MediaConfig as BaseMediaConfig } from "@stackra/media";
 *
 * export class MediaConfig extends BaseMediaConfig {
 *   override uploadExpiresIn = Duration.minutes(15);
 * }
 */
export class MediaConfig extends Config({ schema: MediaOptions }) {}
