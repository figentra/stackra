/**
 * Stackra file contract:
 * Purpose: `NotifierMessage`, one notification prepared for one principal, as the `notifications` Notifier driver hands
 *          it to its target's payload mapper: the template key, the category, the principal, the market, the data every
 *          channel renders and each rendered channel.
 * Boundary: a type only. The driver renders the mail channel once per notification in the default locale; a channel
 *           the notification does not declare is absent from `channels`. No address is here: the target service
 *           resolves the principal's address (ADR 0134).
 * Runtime: node
 * Governing contract: ADR 0223 (as amended by ADR 0294 and ADR 0270); ADR 0134; ADR 0422 (decision 1).
 */
import type { PublicId } from "@stackra/contracts";

import type { NotificationCategory } from "#core/enums/notification-category.enum";

/** A notification for one principal, ready for the target's payload. */
export interface NotifierMessage {
  /** The notification's snake_case stem (`order_receipt`), the target's template key. */
  readonly template: string;

  /** The notification's category, for preferences and consent. */
  readonly category: NotificationCategory;

  /** The recipient principal's public id. */
  readonly principalId: PublicId<"usr">;

  /** The Market the call acts in (`sa`), when the host binds a `MarketContext`; undefined otherwise. */
  readonly market: string | undefined;

  /** What the notification's `data(event)` returned, or the event. */
  readonly data: unknown;

  /** Each rendered channel the notification declares. */
  readonly channels: {
    /** The mail: subject, HTML and plain text. */
    readonly mail?: { readonly subject: string; readonly html: string; readonly text: string };
  };
}
