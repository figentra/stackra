/**
 * Stackra file contract:
 * Purpose: `TreeNode`, one node of a tree (a member and its generated kinds): a label, an optional count, note and
 *          status, and its children.
 * Boundary: a type only. The first level is drawn; every level under `--verbose`.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-010.
 */
import type { CheckStatus } from "#contracts/types/check-status.type";

/** A node of a tree. */
export interface TreeNode {
  /** The node's text. */
  readonly label: string;

  /** A count shown after the label. */
  readonly count?: number;

  /** A dim note after the count. */
  readonly note?: string;

  /** A status cell before the label. */
  readonly status?: CheckStatus;

  /** Its children. */
  readonly children?: readonly TreeNode[];
}
