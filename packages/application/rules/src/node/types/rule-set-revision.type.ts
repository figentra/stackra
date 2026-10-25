/**
 * Stackra file contract:
 * Purpose: `RuleSetRevision`, one revision of a rule set as `RuleSetService.revision` reads it: its number, its
 *          condition and when it was last published.
 * Boundary: a type only. The condition is the stored JSON; `evaluate` checks it again against the consumer's `Rules`
 *           before it runs, so a revision that names a field no longer registered is refused there.
 * Runtime: node
 * Governing contract: ADR 0331 (decision 5).
 */
import type { Condition } from "#core/index";

/** A rule set revision. */
export interface RuleSetRevision {
  /** The revision's number, from 1. */
  readonly number: number;

  /** The condition the revision holds. */
  readonly condition: Condition;

  /** When the revision was last published; null for a draft. */
  readonly publishedAt: Date | null;
}
