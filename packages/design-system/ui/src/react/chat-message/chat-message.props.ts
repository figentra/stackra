/**
 * Stackra file contract:
 * Purpose: `ChatMessageProps`, the props of the web `ChatMessage`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChatMessageContractProps } from "#contracts/types/chat-message-contract-props.type";

/** Props of the web ChatMessage. */
export type ChatMessageProps = ChatMessageContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
