/**
 * Stackra file contract:
 * Purpose: the web `ChatConversation` compound on HeroUI Pro's ChatConversation: a scrolling thread that sticks to
 *          the bottom, with the parts Content, ScrollAnchor and ScrollButton; the scroll button is named by `label`.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`, and the scroll tracking
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

/** Props of the web ChatConversation: the shared contract plus HeroUI Pro's own div props, passed through. */
export type ChatConversationProps = ChatConversationContractProps &
  Omit<HeroChatConversationProps, keyof ChatConversationContractProps>;

/** Props of the scroll button: the shared contract plus HeroUI Pro's button props, with `aria-label` as `label`. */
export type ChatConversationScrollButtonProps = ChatConversationScrollButtonContractProps &
  Omit<
    HeroChatConversationScrollButtonProps,
    keyof ChatConversationScrollButtonContractProps | "aria-label"
  >;

/** The scrolling root: HeroUI Pro's, which follows new content while the reader is at the bottom. */
function ChatConversationRoot(props: ChatConversationProps) {
  return <HeroChatConversation.Root {...props} />;
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
