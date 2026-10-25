/**
 * Stackra file contract:
 * Purpose: `NotificationCategory`, the category a notification declares in `Notification({ category })`: it decides
 *          whether a person's preferences may mute it and whether it needs their opt-in, as case data
 *          (`Enum.meta(NotificationCategory, c).mutable`, `.optIn`).
 * Boundary: an `Enum.of` value plus the type of the same name. The notifications service applies preferences and
 *           consent from this data (ADR 0223 decision 5 as amended by ADR 0270); this package only carries it on each
 *           delivery. A new category is a new case here.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (category drives channel and consent); ADR 0086; ADR 0294 (decision 16: Enum.of).
 */
import { Enum } from "@stackra/contracts";

/** Every notification category; `Enum.meta` tells whether preferences may mute it and whether it needs opt-in. */
export const NotificationCategory = Enum.of({
  /** Receipts, confirmations, one-time codes and security alerts: always sent, never muted, no unsubscribe link. */
  Transactional: ["transactional", { mutable: false, optIn: false }],
  /** Updates about the person's own records: sent until the person mutes the category. */
  Activity: ["activity", { mutable: true, optIn: false }],
  /** News and offers: sent only after the person opts in, and muted again by one unsubscribe. */
  Marketing: ["marketing", { mutable: true, optIn: true }],
});

/** One of the codes above. */
export type NotificationCategory = Enum.Value<typeof NotificationCategory>;
