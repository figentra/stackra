/**
 * Stackra file contract:
 * Purpose: the web `ChatConversation` compound on HeroUI Pro's ChatConversation: a scrolling thread that sticks to
 *          the bottom, with the parts Content, ScrollAnchor and ScrollButton. The thread is a `log` named by `label`
 *          that takes focus, so the keyboard can scroll it (WCAG 2.1.1); the scroll button is named by its `label`.
 * Boundary: no styling of its own; the look needs `@heroui-pro/react/css`, and the scroll tracking
 *          needs a layout engine. The compound exposes the documented parts: HeroUI Pro's `ChatConversation.Root`
 *          is left out. Imports the `chat-conversation` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatConversation as HeroChatConversation,
  type ChatConversationProps as HeroChatConversationProps,
  type ChatConversationScrollButtonProps as HeroChatConversationScrollButtonProps,
} from "@heroui-pro/react/chat-conversation";

import type {
  ChatConversationContractProps,
  ChatConversationScrollButtonContractProps,
} from "#contracts/types/chat-conversation-contract-props.type";

/** Props of the web ChatConversation: the shared contract plus HeroUI Pro's own div props, with `aria-label` as `label`. */
export type ChatConversationProps = ChatConversationContractProps &
  Omit<HeroChatConversationProps, keyof ChatConversationContractProps | "aria-label">;

/** Props of the scroll button: the shared contract plus HeroUI Pro's button props, with `aria-label` as `label`. */
export type ChatConversationScrollButtonProps = ChatConversationScrollButtonContractProps &
  Omit<
    HeroChatConversationScrollButtonProps,
    keyof ChatConversationScrollButtonContractProps | "aria-label"
  >;

/**
 * The scrolling root: HeroUI Pro's, which follows new content while the reader is at the bottom. A chat history is a
 * `log` (new messages are read out politely), and it scrolls, so it is in the tab order to scroll from the keyboard.
 */
function ChatConversationRoot({ label, ...rest }: ChatConversationProps) {
  return <HeroChatConversation.Root role="log" tabIndex={0} {...rest} aria-label={label} />;
}

/** The button that jumps to the latest message: HeroUI Pro's, named by `label`. */
function ChatConversationScrollButton({ label, ...rest }: ChatConversationScrollButtonProps) {
  return <HeroChatConversation.ScrollButton {...rest} aria-label={label} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatConversationParts {
  /** The column that holds the messages. */
  readonly Content: typeof HeroChatConversation.Content;
  /** The marker at the end of the thread that the scroll follows. */
  readonly ScrollAnchor: typeof HeroChatConversation.ScrollAnchor;
  /** The button that jumps to the bottom, shown while the reader is above it and named by `label`. */
  readonly ScrollButton: typeof ChatConversationScrollButton;
}

/** A scrolling chat thread: `ChatConversation.Content` with the messages, `ScrollAnchor` and `ScrollButton`. */
export const ChatConversation: typeof ChatConversationRoot & ChatConversationParts = Object.assign(
  ChatConversationRoot,
  {
    Content: HeroChatConversation.Content,
    ScrollAnchor: HeroChatConversation.ScrollAnchor,
    ScrollButton: ChatConversationScrollButton,
  },
);
