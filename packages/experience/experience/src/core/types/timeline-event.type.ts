/**
 * Stackra file contract:
 * Purpose: `TimelineEvent`, one step of a timeline hero's route: when it happened, what happened and who or where.
 * Boundary: a type only; `Text` is `LocalizedText` in a document and `string` once resolved for drawing. The time is
 *           words as the page shows them ("Mon 09:12"), so each locale writes its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); ADR 0305 (rule 2); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A step of the route. */
export interface TimelineEvent<Text = LocalizedText> {
  /** When it happened, as the page shows it ("Mon 09:12"). */
  readonly time: Text;

  /** What happened ("Out for delivery"). */
  readonly status: Text;

  /** Who did it, or where ("SMSA Express, Riyadh"). */
  readonly actor?: Text;
}
