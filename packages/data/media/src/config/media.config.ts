/**
 * Stackra file contract:
 * Purpose: `MediaConfig`, the media configuration (key `media`): the `uploader` and `scanner` driver choices runway
 *          sets per environment, the upload lifetime, the upload endpoint, and the running environment, which refuses
 *          the `memory` scanner outside `dev` and `test` at boot (STA-669).
 * Boundary: a configuration class over `MediaOptions`; its env map is `STACKRA_ENVIRONMENT` only, which makes
 *           `environment` runtime-only: `buildConfig` checks the variable against the one closed list and refuses a
 *           value for the field (STA-2844), and the server `createApp` settles it through `readEnvironment` (a deployed
 *           Encore service from the generated `environment.ts`). Runway's `config.media` layer sets the drivers. A host
 *           overrides it as `class MediaConfig extends BaseMediaConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 20); ADR 0146 as amended; ADR 0296 (decision 1; amendment
 *                     2026-11-26: the environment comes from the runtime only); ADR 0222 (an unscanned file is never
 *                     served); ADR 0266 (decision 2); STA-2844; STA-669.
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
export class MediaConfig extends Config({
  schema: MediaOptions,
  env: { environment: "STACKRA_ENVIRONMENT" },
}) {}
