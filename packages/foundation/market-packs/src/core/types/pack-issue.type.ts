/**
 * Stackra file contract:
 * Purpose: `PackIssue`, one finding of a pack's publish check: its code, the entry key and a sentence for the pack
 *          author.
 * Boundary: a type only. The message names keys, dates and bounds, never a secret; the pack is public data.
 * Runtime: isomorphic
 * Governing contract: ADR 0417.
 */
import type { PackIssueCode } from "#core/enums/pack-issue-code.enum";

/** One publish-check finding. */
export type PackIssue = {
  /** What is wrong. */
  readonly code: PackIssueCode;
  /** The entry key it is about. */
  readonly key: string;
  /** What to fix, for the pack author. */
  readonly message: string;
};
