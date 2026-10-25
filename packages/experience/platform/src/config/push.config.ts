/**
 * Stackra file contract:
 * Purpose: `PushConfig`, the push configuration (key `platform.push`): the transport, the foreground rule, the
 *          Android channels and when the OS prompt first shows. An app's override of it mounts the push context.
 * Boundary: a configuration class over `PushOptions` with no env map; an app feeds `provider` and `vapidPublicKey`
 *           per environment through its `EnvConfig` (`pushProvider`, `pushVapidPublicKey`). A host overrides it as
 *           `class PushConfig extends BasePushConfig` with `override` members only, inheriting the key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0255 (decision 3).
 */
import { Config } from "@stackra/config";

import { PushOptions } from "#core/schemas/push-options.schema";

/**
 * The push configuration.
 *
 * @example
 * import { PushConfig as BasePushConfig } from "@stackra/platform";
 *
 * export class PushConfig extends BasePushConfig {
 *   override provider: DriverName<PushTransport> = "expo";
 *   override askOn: PromptMoment = PromptMoment.FirstSession;
 * }
 */
export class PushConfig extends Config({ schema: PushOptions }) {}
