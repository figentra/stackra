/**
 * Stackra file contract:
 * Purpose: `CommentThreadProps`, the props of the native `CommentThread`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { CommentThreadContractProps } from "#contracts/types/comment-thread-contract-props.type";

/** Props of the native CommentThread. */
export type CommentThreadProps = CommentThreadContractProps & {
  readonly className?: string | undefined;
};
