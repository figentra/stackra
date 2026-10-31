/**
 * Stackra file contract:
 * Purpose: the native `ChatMessage`: one turn of a chat. The person's turn is a compact bubble on the default fill at
 *          the reading end; the assistant's is unboxed beside its avatar. Attachments sit above the text and the
 *          actions row under it; "Thinking…" shimmers while the assistant has not written.
 * Boundary: string children are drawn in the kit's Text and read after the author's name ("You, …"), so a screen
 *           reader tells the turns apart; the actions stay reachable one by one. Flex rows follow the layout direction, so the bubble moves to
 *           the left in Arabic. Colours, radius and type are tokens.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1; STA-1371 (component gaps,
 *          owner approval 2026-10-31).
 */
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ChatMessageProps } from "#native/chat-message/chat-message.props";
import { Shimmer } from "#native/shimmer/shimmer";
import { Text } from "#native/text/text";

/** The message's words. */
const K = AI_PARTS_KEYS.ui.chat_message;

/** Draws plain text in the kit's Text, read after its author; anything else as given. */
const textOf = (children: ReactNode, author: string): ReactNode =>
  typeof children === "string" || typeof children === "number" ? (
    <Text accessibilityLabel={`${author}, ${children}`} className="text-sm leading-relaxed">
      {children}
    </Text>
  ) : (
    children
  );

/** One turn of a chat. */
export function ChatMessage({
  from,
  children,
  avatar,
  attachments,
  actions,
  isLoading = false,
  authorLabel,
  className,
}: ChatMessageProps): ReactElement {
  const t = useUiText();
  const author = authorLabel ?? t(from === "user" ? K.user : K.assistant);
  const body = isLoading ? <Shimmer /> : textOf(children, author);
  if (from === "user") {
    return (
      <View className={`items-end gap-2 ${className ?? ""}`}>
        {attachments ? <View className="flex-row flex-wrap justify-end gap-2">{attachments}</View> : null}
        <View className="max-w-[80%] rounded-[var(--radius-container)] bg-default px-4 py-2">{body}</View>
        {actions}
      </View>
    );
  }
  return (
    <View className={`flex-row items-start gap-3 py-2 ${className ?? ""}`}>
      {avatar ? <View className="shrink-0">{avatar}</View> : null}
      <View className="min-w-0 flex-1 gap-2 pe-12">
        {attachments ? <View className="flex-row flex-wrap gap-2">{attachments}</View> : null}
        <View>{body}</View>
        {actions}
      </View>
    </View>
  );
}
