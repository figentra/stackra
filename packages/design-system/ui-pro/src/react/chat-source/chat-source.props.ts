/**
 * Stackra file contract:
 * Purpose: `ChatSourceProps`, props of the web ChatSource: the shared contract plus HeroUI Pro's own chip props,
 *          passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatSourceProps as HeroChatSourceProps } from "@heroui-pro/react/chat-source";

import type { ChatSourceContractProps } from "#contracts/types/chat-source-contract-props.type";

/** Props of the web ChatSource: the shared contract plus HeroUI Pro's own chip props, passed through. */
export type ChatSourceProps = ChatSourceContractProps &
  Omit<HeroChatSourceProps, keyof ChatSourceContractProps>;
