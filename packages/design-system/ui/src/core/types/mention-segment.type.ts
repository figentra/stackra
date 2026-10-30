/**
 * Stackra file contract:
 * Purpose: `MentionSegment`, a run of a comment: plain text, or a mention of a known person (`mentionSegmentsOf`).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { CommentPerson } from "#contracts/types/comment-person.type";

/** A run of a comment: plain text, or a mention of `person`. */
export interface MentionSegment {
  readonly text: string;
  readonly person?: CommentPerson | undefined;
}
