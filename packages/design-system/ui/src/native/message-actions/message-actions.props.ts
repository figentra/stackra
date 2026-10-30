/**
 * Stackra file contract:
 * Purpose: `MessageActionsProps`, the props of the native `MessageActions`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { MessageActionsContractProps } from "#contracts/types/message-actions-contract-props.type";

/** Props of the native MessageActions. */
export type MessageActionsProps = MessageActionsContractProps & {
  /** Styles the row. */
  readonly className?: string | undefined;
};
