/**
 * Stackra file contract:
 * Purpose: `NotificationGroup`, one heading of the `NotificationsPanel` with the items listed under it.
 * Boundary: types only; internal, built by `groupNotifications`.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28); ADR 0305 (one declaration per file).
 */
import type { NotificationItem } from "#contracts/types/notification-item.type";

/** A group heading (undefined for items with none) and its items in their given order. */
export interface NotificationGroup {
  readonly heading: string | undefined;
  readonly items: readonly NotificationItem[];
}
