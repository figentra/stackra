/**
 * Stackra file contract:
 * Purpose: `AcceptedBreakList`, the parsed accepted-breaks file: the well-formed entries and a problem line for each
 *          entry that is not.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4); STA-2837.
 */
import type { AcceptedBreak } from "#node/contract/types/accepted-break.type";

/** The accepted-breaks file, checked. */
export type AcceptedBreakList = {
  /** The well-formed entries, expired ones included. */
  readonly entries: readonly AcceptedBreak[];

  /** One line per malformed entry; each fails the check. */
  readonly problems: readonly string[];
};
