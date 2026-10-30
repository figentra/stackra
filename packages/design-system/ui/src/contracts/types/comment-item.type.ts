/**
 * Stackra file contract:
 * Purpose: `CommentItem`, one comment of a thread: its author, text (with `@Name` mentions) and when it was written.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0225 (comments); STA-1371.
 */
import type { CommentPerson } from "#contracts/types/comment-person.type";

/** One comment in a thread, with its author and text. */
export interface CommentItem {
  /** A stable id, unique within the thread. */
  readonly id: string;
  /** The person who wrote it. */
  readonly author: CommentPerson;
  /** The comment text as written. */
  readonly body: string;
  /** When it was written, ISO 8601. */
  readonly createdAt: string;
}
