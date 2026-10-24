/**
 * Stackra file contract:
 * Purpose: the web `ChatMessage` set on HeroUI Pro's ChatMessage: the parts User, Assistant, Avatar, Bubble, Body,
 *          Content, Media, Actions and Action; the action button is named by `label`, the rest are HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's `ChatMessage`
 *          is a set of parts with no root component, so this is too. Imports the `chat-message` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import {
  ChatMessage as HeroChatMessage,
  type ChatMessageActionProps as HeroChatMessageActionProps,
} from "@heroui-pro/react/chat-message";

import type { ChatMessageActionContractProps } from "#contracts/types/chat-message-contract-props.type";

/** Props of the message action: the shared contract plus HeroUI Pro's button props, with `aria-label` as `label`. */
export type ChatMessageActionProps = ChatMessageActionContractProps &
  Omit<HeroChatMessageActionProps, keyof ChatMessageActionContractProps | "aria-label">;

/** An icon-only action under a message: HeroUI Pro's, named by `label`. */
function ChatMessageAction({ label, ...rest }: ChatMessageActionProps) {
  return <HeroChatMessage.Action {...rest} aria-label={label} />;
}

/** The parts of the set, typed from HeroUI Pro's own so the declaration output can name them. */
interface ChatMessageParts {
  /** A message from the person using the chat, aligned to the end. */
  readonly User: typeof HeroChatMessage.User;
  /** A message from the assistant, aligned to the start. */
  readonly Assistant: typeof HeroChatMessage.Assistant;
  /** The sender's avatar; its `show` switch keeps the row aligned in grouped threads. */
  readonly Avatar: typeof HeroChatMessage.Avatar;
  /** The coloured bubble around the content. */
  readonly Bubble: typeof HeroChatMessage.Bubble;
  /** The column that holds the content, the media and the actions. */
  readonly Body: typeof HeroChatMessage.Body;
  /** The message text. */
  readonly Content: typeof HeroChatMessage.Content;
  /** Images or other media in the message. */
  readonly Media: typeof HeroChatMessage.Media;
  /** The row of actions under the message. */
  readonly Actions: typeof HeroChatMessage.Actions;
  /** One action in that row, named by `label`. */
  readonly Action: typeof ChatMessageAction;
}

/** A chat message: `ChatMessage.User` or `Assistant`, holding an `Avatar` and a `Body` of `Bubble`, `Media` and `Actions`. */
export const ChatMessage: ChatMessageParts = {
  User: HeroChatMessage.User,
  Assistant: HeroChatMessage.Assistant,
  Avatar: HeroChatMessage.Avatar,
  Bubble: HeroChatMessage.Bubble,
  Body: HeroChatMessage.Body,
  Content: HeroChatMessage.Content,
  Media: HeroChatMessage.Media,
  Actions: HeroChatMessage.Actions,
  Action: ChatMessageAction,
};
