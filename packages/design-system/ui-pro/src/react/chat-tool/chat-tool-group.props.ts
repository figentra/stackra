/**
 * Stackra file contract:
 * Purpose: `ChatToolGroupProps`, props of the web ChatToolGroup: the shared contract plus HeroUI Pro's own, with
 *          `active` renamed `isActive`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatToolGroupProps as HeroChatToolGroupProps } from "@heroui-pro/react/chat-tool";

import type { ChatToolGroupContractProps } from "#contracts/types/chat-tool-group-contract-props.type";

/** Props of the web ChatToolGroup: the shared contract plus HeroUI Pro's own, with `active` renamed `isActive`. */
export type ChatToolGroupProps = ChatToolGroupContractProps &
  Omit<HeroChatToolGroupProps, keyof ChatToolGroupContractProps | "active">;
