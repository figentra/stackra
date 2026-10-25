/**
 * Stackra file contract:
 * Purpose: `NotificationsConfig`, the notifications configuration (key `notifications`): the `Notifier` driver gen's
 *          wiring selects by `config:notifications.driver`.
 * Boundary: a configuration class over `NotificationsOptions` with no env map; runway's `config.notifications` layer
 *           sets it per environment. A host overrides it as `class NotificationsConfig extends
 *           BaseNotificationsConfig` with `override` members only.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 19 and 20); ADR 0146 as amended; ADR 0266 (decision 5).
 */
import { Config } from "@stackra/config";

import { NotificationsOptions } from "#core/schemas/notifications-options.schema";

/**
 * The notifications configuration.
 *
 * @example
 * import { NotificationsConfig as BaseNotificationsConfig } from "@stackra/notifications";
 *
 * export class NotificationsConfig extends BaseNotificationsConfig {
 *   override driver: DriverName<Notifier> = "memory";
 * }
 */
export class NotificationsConfig extends Config({ schema: NotificationsOptions }) {}
