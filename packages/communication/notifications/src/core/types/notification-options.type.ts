/**
 * Stackra file contract:
 * Purpose: `NotificationOptions`, the argument of `Notification({ category })`.
 * Boundary: a type only. The key (`<module>.<snake(class minus "Notification")>`), the trigger (the type of
 *           `recipients`' parameter), the channels (the methods present) and the mail body (the `.mail.tsx` of the same
 *           stem) are derived by gen, so they are not options (ADR 0294 decision 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 3, 16 and 20); ADR 0223.
 */
import type { NotificationCategory } from "#core/enums/notification-category.enum";

/** The options of a notification. */
export interface NotificationOptions {
  /** Whether preferences may mute it and whether it needs the person's opt-in. */
  readonly category: NotificationCategory;
}
