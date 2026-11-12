/**
 * Stackra file contract:
 * Purpose: `TimelineRoute`, what a timeline hero follows: its origin and destination, an optional reference (a
 *          waybill, an order number) and its events, oldest first, the last being where it stands now.
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

import type { TimelineEvent } from "#core/types/timeline-event.type";

/** The route the hero follows. */
export interface TimelineRoute<Text = LocalizedText> {
  /** The events' spoken name; name the route in it ("Parcel from Riyadh to Jeddah"), as the arrow is not spoken. */
  readonly label: Text;

  readonly origin: Text;

  readonly destination: Text;

  /** The window's title, as its owner writes it (never translated): a waybill, an order number. */
  readonly reference?: string;

  /** Oldest first; the last is the current one. */
  readonly events: TimelineEvent<Text>[];
}
