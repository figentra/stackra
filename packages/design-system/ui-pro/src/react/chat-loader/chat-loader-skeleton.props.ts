/**
 * Stackra file contract:
 * Purpose: `ChatLoaderSkeletonProps`, props of `ChatLoader.Skeleton`: the shared contract plus HeroUI Pro's own div
 *          props, passed through.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ChatLoaderSkeletonProps as HeroChatLoaderSkeletonProps } from "@heroui-pro/react/chat-loader";

import type { ChatLoaderContractProps } from "#contracts/types/chat-loader-contract-props.type";

/** Props of `ChatLoader.Skeleton`: the shared contract plus HeroUI Pro's own div props, passed through. */
export type ChatLoaderSkeletonProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderSkeletonProps, keyof ChatLoaderContractProps | "aria-label">;
