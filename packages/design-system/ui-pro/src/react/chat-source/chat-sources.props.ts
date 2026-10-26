/**
 * Stackra file contract:
 * Purpose: `ChatSourcesProps`, props of the web ChatSources: the shared contract plus HeroUI Pro's own disclosure
 *          props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatSourcesProps as HeroChatSourcesProps } from "@heroui-pro/react/chat-source";

import type { ChatSourcesContractProps } from "#contracts/types/chat-sources-contract-props.type";

/** Props of the web ChatSources: the shared contract plus HeroUI Pro's own disclosure props, passed through. */
export type ChatSourcesProps = ChatSourcesContractProps &
  Omit<HeroChatSourcesProps, keyof ChatSourcesContractProps>;
