/**
 * Stackra file contract:
 * Purpose: `PruneActivityInput`, the input of `activity.activity_entry.prune@1`: how many days of the feed to keep.
 * Boundary: a shape class in its own file; the cron passes `{ keepDays: 90 }`, and a run queued by hand may pass its
 *           own, 1 to 3650 days.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0305; ADR 0148 (decision 5: a cron's input).
 */
import { Int, Schema } from "@stackra/validation";

/** The retention of one prune run. */
export class PruneActivityInput extends Schema {
  /** Entries that happened more than this many days ago are deleted. */
  @Int({
    min: 1,
    max: 3650,
  })
  keepDays = 90;
}
