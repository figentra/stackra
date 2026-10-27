/**
 * Stackra file contract:
 * Purpose: the `PreferenceStore` port: a person's delivery preferences per category and channel: whether a category
 *          may reach them on a channel (`allows`) and their choice (`set`). A mandatory category is always allowed and
 *          can never be turned off.
 * Boundary: an abstract class that is its own token. Every method names the recipient, and a driver answers and
 *           changes that recipient's choices only. A driver answers by `preferenceAllows` (`.`): mandatory categories
 *           (configuration, `NotificationsConfig.mandatoryCategories`) and non-mutable ones are always allowed, an
 *           unset choice follows the category's opt-in rule. Drivers live where preferences are stored (the
 *           notifications service); this package ships the port and the `memory` driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 5 as amended by ADR 0270); ADR 0294 (decisions 15 to 17); ADR 0305 (rule 8);
 *                     ACA-539 and STA-964 (mandatory categories); stackra-218 (STA-1376).
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";

/**
 * Keeps delivery preferences.
 *
 * @example
 * if (await preferences.allows(principalId, "marketing", NotificationChannel.Mail)) await transport.send(mail, key);
 * await preferences.set(principalId, "marketing", NotificationChannel.Mail, false); // one-click unsubscribe
 */
export abstract class PreferenceStore extends Port {
  /** Whether `category` may reach `recipient` on `channel`. */
  abstract allows(
    recipient: PublicId<"usr">,
    category: string,
    channel: NotificationChannel,
  ): Promise<boolean>;

  /**
   * Records `recipient`'s choice for `category` on `channel`.
   *
   * @returns false, recording nothing, when `enabled` is false for a category that cannot be muted.
   */
  abstract set(
    recipient: PublicId<"usr">,
    category: string,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<boolean>;
}
