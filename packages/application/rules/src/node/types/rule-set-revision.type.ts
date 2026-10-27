/**
 * Stackra file contract:
 * Purpose: `RuleSetRevision`, one revision of a rule set as `RuleSetService.revision` reads it: its number, its
 *          condition and outcomes (a `RuleDocument`), when it was last published, and whether a seed wrote it.
 * Boundary: a type only. The condition and outcomes are the stored JSON; `evaluate` and `decide` check them again
 *           against the consumer's `Rules` before they run, so a revision that names a field or an outcome kind no
 *           longer registered is refused there. A revision stored before outcomes existed reads as no outcomes.
 * Runtime: node
 * Governing contract: ADR 0331 (decisions 5 and 9); config-model section 6 (seeds never overwrite tenant edits);
 *                     ADR 0455 (decision 1).
 */
import type { RuleDocument } from "#core/index";

/** A rule set revision. */
export interface RuleSetRevision extends RuleDocument {
  /** The revision's number, from 1; `0` for a pack's default that is not stored (`RuleSetService.openDefault`). */
  readonly number: number;

  /** The pack version a seed wrote it from; absent for a tenant's revision. */
  readonly seedVersion?: string;

  /** When the revision was last published; null for a draft. */
  readonly publishedAt: Date | null;
}
