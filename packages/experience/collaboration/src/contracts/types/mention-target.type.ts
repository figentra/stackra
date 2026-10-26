/**
 * Stackra file contract:
 * Purpose: `MentionTarget`, one mention in a comment: its kind and the id of what it names (`null` for the assistant).
 * Boundary: a type only, JSON as it is. A comment keeps each target once.
 * Runtime: isomorphic
 * Governing contract: ADR 0433 (decision 3); OS-226.
 */
import type { MentionKind } from "#contracts/enums/mention-kind.enum";

/** Who or what a comment mentions. */
export interface MentionTarget {
  /** What it points at. */
  readonly kind: MentionKind;

  /** The member, team, role or participant id; null for the assistant. */
  readonly id: string | null;
}
