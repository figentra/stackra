/**
 * Stackra file contract:
 * Purpose: `ChatToolProps`, props of the web ChatTool: the shared contract plus HeroUI Pro's own, with `active`
 *          renamed `isActive`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatToolProps as HeroChatToolProps } from "@heroui-pro/react/chat-tool";

import type { ChatToolContractProps } from "#contracts/types/chat-tool-contract-props.type";

/** Props of the web ChatTool: the shared contract plus HeroUI Pro's own, with `active` renamed `isActive`. */
export type ChatToolProps = ChatToolContractProps &
  Omit<HeroChatToolProps, keyof ChatToolContractProps | "active">;
