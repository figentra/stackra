/**
 * Stackra file contract:
 * Purpose: `TimelineItem`, one entry of a Timeline: what happened, who did it, when, an icon and tone, and an
 *          optional body.
 * Boundary: types only; the time is an instant (a `Date` or an ISO string) shown in the reader's time zone.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { Tone } from "@stackra/contracts";
import type { ReactNode } from "react";

import type { IconSlot } from "#contracts/types/icon-slot.type";

/** One timeline entry. */
export interface TimelineItem {
  /** Unique within the timeline. */
  readonly id: string;
  /** What happened, for example "approved the quote". */
  readonly title: ReactNode;
  /** Who did it, written before the title; kept in its own direction. */
  readonly actor?: string | undefined;
  /** When it happened. */
  readonly at: Date | string;
  /** The marker's icon; left out, a dot. */
  readonly icon?: IconSlot | undefined;
  /** The marker's tone. Defaults to `default`. */
  readonly tone?: Tone | undefined;
  /** More detail under the title: a note, a quote, a link. Hidden in the compact variant. */
  readonly body?: ReactNode;
}
