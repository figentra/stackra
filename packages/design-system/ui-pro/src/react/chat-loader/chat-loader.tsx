/**
 * Stackra file contract:
 * Purpose: the web `ChatLoader` set on HeroUI Pro's ChatLoader: the indicators Dots, Pulse, Spinner and Skeleton,
 *          which take the shared `size` and the accessible name `label`, and the skeleton parts Avatar, Block and
 *          Line, HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro spreads the
 *          rest of the props after its own `aria-label`, so the types refuse `aria-label` and `label` is the one
 *          name. Imports the `chat-loader` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatLoader as HeroChatLoader,
  type ChatLoaderDotsProps as HeroChatLoaderDotsProps,
  type ChatLoaderPulseProps as HeroChatLoaderPulseProps,
  type ChatLoaderSkeletonProps as HeroChatLoaderSkeletonProps,
  type ChatLoaderSpinnerProps as HeroChatLoaderSpinnerProps,
} from "@heroui-pro/react/chat-loader";

import type { ChatLoaderContractProps } from "#contracts/types/chat-loader-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of `ChatLoader.Dots`: the shared contract plus HeroUI Pro's own span props, passed through. */
export type ChatLoaderDotsProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderDotsProps, keyof ChatLoaderContractProps | "aria-label">;

/** Props of `ChatLoader.Pulse`: the shared contract plus HeroUI Pro's own span props, passed through. */
export type ChatLoaderPulseProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderPulseProps, keyof ChatLoaderContractProps | "aria-label">;

/** Props of `ChatLoader.Spinner`: the shared contract plus HeroUI Pro's own span props, passed through. */
export type ChatLoaderSpinnerProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderSpinnerProps, keyof ChatLoaderContractProps | "aria-label">;

/** Props of `ChatLoader.Skeleton`: the shared contract plus HeroUI Pro's own div props, passed through. */
export type ChatLoaderSkeletonProps = ChatLoaderContractProps &
  Omit<HeroChatLoaderSkeletonProps, keyof ChatLoaderContractProps | "aria-label">;

/** Three bouncing dots. */
function ChatLoaderDots({ label, size, ...rest }: ChatLoaderDotsProps) {
  return <HeroChatLoader.Dots {...rest} {...omitUndefined({ label, size })} />;
}

/** A pulsing dot. */
function ChatLoaderPulse({ label, size, ...rest }: ChatLoaderPulseProps) {
  return <HeroChatLoader.Pulse {...rest} {...omitUndefined({ label, size })} />;
}

/** A spinning ring. */
function ChatLoaderSpinner({ label, size, ...rest }: ChatLoaderSpinnerProps) {
  return <HeroChatLoader.Spinner {...rest} {...omitUndefined({ label, size })} />;
}

/** A message-shaped placeholder; draws an avatar and three lines when it has no children. */
function ChatLoaderSkeleton({ label, size, ...rest }: ChatLoaderSkeletonProps) {
  return <HeroChatLoader.Skeleton {...rest} {...omitUndefined({ label, size })} />;
}

/** The parts of the set, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatLoaderParts {
  /** Three bouncing dots, named by `label`. */
  readonly Dots: typeof ChatLoaderDots;
  /** A pulsing dot, named by `label`. */
  readonly Pulse: typeof ChatLoaderPulse;
  /** A spinning ring, named by `label`. */
  readonly Spinner: typeof ChatLoaderSpinner;
  /** A message-shaped placeholder, named by `label`. */
  readonly Skeleton: typeof ChatLoaderSkeleton;
  /** The avatar circle inside a skeleton. */
  readonly SkeletonAvatar: typeof HeroChatLoader.SkeletonAvatar;
  /** The block that holds the skeleton lines. */
  readonly SkeletonBlock: typeof HeroChatLoader.SkeletonBlock;
  /** One skeleton text line. */
  readonly SkeletonLine: typeof HeroChatLoader.SkeletonLine;
}

/** Loading indicators for a chat: `ChatLoader.Dots`, `Pulse`, `Spinner` or a `Skeleton` with its parts. */
export const ChatLoader: ChatLoaderParts = {
  Dots: ChatLoaderDots,
  Pulse: ChatLoaderPulse,
  Spinner: ChatLoaderSpinner,
  Skeleton: ChatLoaderSkeleton,
  SkeletonAvatar: HeroChatLoader.SkeletonAvatar,
  SkeletonBlock: HeroChatLoader.SkeletonBlock,
  SkeletonLine: HeroChatLoader.SkeletonLine,
};
