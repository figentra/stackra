/**
 * Stackra file contract:
 * Purpose: `ChatLoaderDotsProps`, props of `ChatLoader.Dots`: the shared contract plus HeroUI Pro's own span props,
 *          passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatLoaderDotsProps as HeroChatLoaderDotsProps } from "@heroui-pro/react/chat-loader";

import type { ChatLoaderContractProps } from "#contracts/types/chat-loader-contract-props.type";

/** Props of `ChatLoader.Dots`: the shared contract plus HeroUI Pro's own span props, passed through. */
export type ChatLoaderDotsProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderDotsProps, keyof ChatLoaderContractProps | "aria-label">;
