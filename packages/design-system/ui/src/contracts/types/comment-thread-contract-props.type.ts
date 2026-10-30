/**
 * Stackra file contract:
 * Purpose: `CommentThreadContractProps`, the props of every runtime's `CommentThread`: the comments, a reply box that
 *          suggests people after `@`, and resolve / reopen.
 * Boundary: types only. Sending and resolving are the app's; the thread only reports them.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0225 (comments); STA-1371.
 */
import type { CommentItem } from "#contracts/types/comment-item.type";
import type { CommentPerson } from "#contracts/types/comment-person.type";

/** Props shared by the web and native `CommentThread`. */
export interface CommentThreadContractProps {
  readonly comments: readonly CommentItem[];
  /** The people `@` can mention. */
  readonly people?: readonly CommentPerson[] | undefined;
  /** Called with the reply's text and the ids of the people it mentions. */
  readonly onReply?: ((body: string, mentions: readonly string[]) => void) | undefined;
  readonly isResolved?: boolean | undefined;
  /** Called with the new resolved state; no resolve button without it. */
  readonly onResolvedChange?: ((isResolved: boolean) => void) | undefined;
  /** The thread's accessible name, such as "Comments on line 3". */
  readonly label: string;
}
