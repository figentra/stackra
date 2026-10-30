/**
 * Stackra file contract:
 * Purpose: `NotificationItem`, one entry of the `NotificationsPanel`: what happened, when, its group heading, its
 *          unread state and its tone.
 * Boundary: types only; every visible word is already in the viewer's language (the caller formats the time).
 * Runtime: isomorphic
 * Governing contract: gap inventory row 13 (owner approval 2026-10-28, P1 + P2 core); ADR 0302 (decision 3); ADR 0305.
 */
import type { Tone } from "@stackra/contracts";
import type { ReactNode } from "react";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One notification. */
export interface NotificationItem {
  /** A stable id, handed back to `onItemPress` and `onDismiss`. */
  readonly id: string;
  /** What happened, in a few words; it names the row for assistive technology. */
  readonly title: ReactNode;
  /** Detail under the title. */
  readonly description?: ReactNode | undefined;
  /** When it happened, already formatted ("5 min ago"). */
  readonly time?: ReactNode | undefined;
  /** The heading it is listed under ("Today"), already translated; items keep their order inside a group. */
  readonly group?: string | undefined;
  /** True while the viewer has not read it. */
  readonly isUnread?: boolean | undefined;
  /** The kind of notification; its icon is the tone's unless `icon` is given. */
  readonly tone?: Tone | undefined;
  /** An icon in place of the tone's. */
  readonly icon?: IconSlot | undefined;
}
