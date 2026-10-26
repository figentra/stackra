/**
 * Stackra file contract:
 * Purpose: `ChatLoaderSpinnerProps`, props of `ChatLoader.Spinner`: the shared contract plus HeroUI Pro's own span
 *          props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatLoaderSpinnerProps as HeroChatLoaderSpinnerProps } from "@heroui-pro/react/chat-loader";

import type { ChatLoaderContractProps } from "#contracts/types/chat-loader-contract-props.type";

/** Props of `ChatLoader.Spinner`: the shared contract plus HeroUI Pro's own span props, passed through. */
export type ChatLoaderSpinnerProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderSpinnerProps, keyof ChatLoaderContractProps | "aria-label">;
