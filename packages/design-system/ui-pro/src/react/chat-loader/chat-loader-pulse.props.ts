/**
 * Stackra file contract:
 * Purpose: `ChatLoaderPulseProps`, props of `ChatLoader.Pulse`: the shared contract plus HeroUI Pro's own span props,
 *          passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatLoaderPulseProps as HeroChatLoaderPulseProps } from "@heroui-pro/react/chat-loader";

import type { ChatLoaderContractProps } from "#contracts/types/chat-loader-contract-props.type";

/** Props of `ChatLoader.Pulse`: the shared contract plus HeroUI Pro's own span props, passed through. */
export type ChatLoaderPulseProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderPulseProps, keyof ChatLoaderContractProps | "aria-label">;
