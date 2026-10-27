/**
 * Stackra file contract:
 * Purpose: `canMute(category, mandatory)`, whether a recipient's preferences may mute a category: never for a
 *          category the pack lists as mandatory (emergency broadcast, pickup, a legal notice) nor for one whose
 *          `NotificationCategory` case is not mutable (transactional).
 * Boundary: pure. The mandatory list is configuration (`NotificationsConfig.mandatoryCategories`, set per pack by
 *           runway), never a default here; the notifications service applies the answer to preferences. The same
 *           list goes to `sendAfter`, so a mandatory category also ignores quiet hours.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 5 as amended by ADR 0270); OS-195; ACA-539; STA-964.
 */
import { Enum } from "@stackra/contracts";

import { NotificationCategory } from "#core/enums/notification-category.enum";

/**
 * Whether preferences may mute `category`.
 *
 * @param category - a `NotificationCategory` code or a delivery service's own `messageCategory` code.
 * @param mandatory - the pack's mandatory category codes.
 * @example
 * canMute("pickup", config.mandatoryCategories); // false when the pack lists pickup
 */
export function canMute(category: string, mandatory: readonly string[]): boolean {
  if (mandatory.includes(category)) return false;
  const known: readonly string[] = Enum.values(NotificationCategory);
  return (
    !known.includes(category) ||
    Enum.meta(NotificationCategory, category as NotificationCategory).mutable
  );
}
