/**
 * Stackra file contract:
 * Purpose: `preferenceAllows(category, mandatory, choice)`, the one answer every `PreferenceStore` driver gives: a
 *          category that cannot be muted (mandatory per pack, or not mutable) is always allowed; otherwise the
 *          recipient's recorded choice wins, and with none an opt-in category (marketing) is off and any other is on.
 * Boundary: pure. The mandatory list is configuration (`NotificationsConfig.mandatoryCategories`), passed in, never
 *           defaulted here; an unknown service category (`messageCategory`) is mutable and needs no opt-in.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 5 as amended by ADR 0270); ACA-539; STA-964; stackra-218 (STA-1376).
 */
import { Enum } from "@stackra/contracts";

import { NotificationCategory } from "#core/enums/notification-category.enum";
import { canMute } from "#core/functions/can-mute.function";

/**
 * Whether `category` may be delivered, given the recipient's recorded `choice` (undefined when none).
 *
 * @example
 * preferenceAllows("marketing", config.mandatoryCategories, undefined); // false: marketing needs an opt-in
 * preferenceAllows("pickup", ["pickup"], false); // true: mandatory
 */
export function preferenceAllows(
  category: string,
  mandatory: readonly string[],
  choice: boolean | undefined,
): boolean {
  if (!canMute(category, mandatory)) return true;
  if (choice !== undefined) return choice;
  const known: readonly string[] = Enum.values(NotificationCategory);
  return !(
    known.includes(category) &&
    Enum.meta(NotificationCategory, category as NotificationCategory).optIn
  );
}
