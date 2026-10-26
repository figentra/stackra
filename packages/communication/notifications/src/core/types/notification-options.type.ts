/**
 * Stackra file contract:
 * Purpose: `NotificationOptions`, the argument of `Notification({ category })`.
 * Boundary: a type only. The key (`<module>.<snake(class minus "Notification")>`), the trigger (the type of
 *           `recipients`' parameter), the channels (the methods present) and the mail body (the `.mail.tsx` of the same
 *           stem) are derived by gen, so they are not options (ADR 0294 decision 20).
 * Runtime: isomorphic
 *           `messageCategory` is the delivery service's own category code (`security`, `receipts`), for a target whose
 *           categories are finer than the three `NotificationCategory` cases; absent, the target uses the category.
 * Governing contract: ADR 0294 (decisions 3, 16 and 20); ADR 0223; ADR 0422 (as amended by STA-1235).
 */
import type { NotificationCategory } from "#core/enums/notification-category.enum";

/** The options of a notification. */
export interface NotificationOptions {
  /** Whether preferences may mute it and whether it needs the person's opt-in. */
  readonly category: NotificationCategory;

  /** The delivery service's category code (snake_case, `security`); the category when absent. */
  readonly messageCategory?: string;
}
