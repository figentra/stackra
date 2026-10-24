/**
 * Stackra file contract:
 * Purpose: `NotificationsOptions`, the shape of `NotificationsConfig`: which `Notifier` driver sends.
 * Boundary: a shape class; it registers this package's own schema (`NOTIFICATIONS_CONFIG_SCHEMA`) for itself when the
 *           module loads, so `buildConfig(NotificationsConfig)` validates with no generated file. Runway sets the
 *           driver per environment (`notifications.driver`); code never names a production driver (ADR 0266).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 19 and 26); ADR 0266 (decisions 1 and 5).
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
  /** The `Notifier` driver: `memory` keeps deliveries in the process for dev and tests. */
  driver: DriverName<Notifier> = "memory";
}

registerSchemas([[NotificationsOptions, NOTIFICATIONS_CONFIG_SCHEMA]]);
