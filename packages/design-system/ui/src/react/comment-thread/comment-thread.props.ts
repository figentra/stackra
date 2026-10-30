/**
 * Stackra file contract:
 * Purpose: `CommentThreadProps`, the props of the web `CommentThread`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0225; STA-1371.
 */
import type { CommentThreadContractProps } from "#contracts/types/comment-thread-contract-props.type";

/** Props of the web CommentThread. */
export type CommentThreadProps = CommentThreadContractProps & {
  readonly className?: string | undefined;
};
