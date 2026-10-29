/**
 * Stackra file contract:
 * Purpose: `LiveActivityConfig`, the Live Activity configuration (key `platform.liveActivity`): how long an ended
 *          order or booking stays on the Lock Screen.
 * Boundary: a configuration class over `LiveActivityOptions` with no env map. A host overrides it as
 *           `class LiveActivityConfig extends BaseLiveActivityConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; STA-1539.
 */
import { Config } from "@stackra/config";

import { LiveActivityOptions } from "#core/schemas/live-activity-options.schema";

/**
 * The Live Activity configuration.
 *
 * @example
 * import { Duration } from "@stackra/contracts";
 * import { LiveActivityConfig as BaseLiveActivityConfig } from "@stackra/platform";
 *
 * export class LiveActivityConfig extends BaseLiveActivityConfig {
 *   override endedDismissal = Duration.minutes(30);
 * }
 */
export class LiveActivityConfig extends Config({ schema: LiveActivityOptions }) {}
