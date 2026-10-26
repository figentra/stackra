/**
 * Stackra file contract:
 * Purpose: `ChatListViewProps`, props of the web ChatListView: the shared contract plus HeroUI Pro's own list props,
 *          passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatListViewRootProps as HeroChatListViewRootProps } from "@heroui-pro/react/chat-list-view";

import type { ChatListViewContractProps } from "#contracts/types/chat-list-view-contract-props.type";

/**
 * Props of the web ChatListView: the shared contract plus HeroUI Pro's own list props, passed through. HeroUI Pro's
 * `aria-label` is the contract's `label`, so the type refuses it.
 */
export type ChatListViewProps<T extends object> = ChatListViewContractProps &
  Omit<HeroChatListViewRootProps<T>, keyof ChatListViewContractProps | "aria-label">;
