/**
 * Stackra file contract:
 * Purpose: `PruneActivityOutput`, the output of `activity.activity_entry.prune@1`: how many entries one run deleted.
 * Boundary: a shape class in its own file; built with `PruneActivityOutput.create`, never `new`.
 * Runtime: node
 * Governing contract: ADR 0294; ADR 0305.
 */
import { Int, Schema } from "@stackra/validation";

/** What one prune run did. */
export class PruneActivityOutput extends Schema {
  /** How many entries it deleted in the run's tenant. */
  @Int({ min: 0 })
  deleted!: number;
}
