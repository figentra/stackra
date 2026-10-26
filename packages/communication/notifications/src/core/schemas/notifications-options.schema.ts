/**
 * Stackra file contract:
 * Purpose: `NotificationsOptions`, the shape of `NotificationsConfig`: which `Notifier` driver sends, and which
 *          built-in target the `notifications` driver queues on (`messages` or `delivery`).
 * Boundary: a shape class; it registers this package's own schema (`NOTIFICATIONS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(NotificationsConfig)` validates with no generated file. Runway sets the
 *           driver per environment (`notifications.driver`); code never names a production driver (ADR 0266).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0266 (decisions 1 and 5); ADR 0422 (as
 *                     amended by STA-1235).
 */
import "#core/types/notifier-driver-name.type";
import type { DriverName } from "@stackra/container";
import { registerSchemas, Schema } from "@stackra/validation";

import { NOTIFICATIONS_CONFIG_SCHEMA } from "#core/constants/notifications-config-schema.constant";
import type { Notifier } from "#core/ports/notifier.port";

/**
 * The notifications settings of a member.
 *
 * @example
 * export class NotificationsConfig extends BaseNotificationsConfig {
 *   override driver: DriverName<Notifier> = "memory";
 * }
 */
export class NotificationsOptions extends Schema {
  /**
   * The `Notifier` driver: `memory` keeps deliveries in the process for dev and tests; `notifications` (`./node`)
   * queues rendered mail on the notifications service.
   */
  driver: DriverName<Notifier> = "memory";

  /**
   * The built-in target of the `notifications` driver: `messages` (`messages.message.send@1`, mail only) or
   * `delivery` (`delivery.message.send@1`: category, data, market and mail, and address recipients). A host that
   * passes its own `NotifierTarget` overrides it.
   */
  target: "messages" | "delivery" = "messages";
}

registerSchemas([[NotificationsOptions, NOTIFICATIONS_CONFIG_SCHEMA]]);
