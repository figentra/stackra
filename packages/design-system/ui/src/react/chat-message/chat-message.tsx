/**
 * Stackra file contract:
 * Purpose: the web `ChatMessage`: one turn of a chat. The person's turn is a compact bubble on the default fill at the
 *          reading end; the assistant's is unboxed beside its avatar, so a long answer reads like a page. Attachments
 *          sit above the text and the actions row under it; "Thinking…" shimmers while the assistant has not written.
 * Boundary: a plain group whose author is read first (visually hidden), so each turn reads apart inside the
 *           conversation's `log` region (`MessageScroller`). Logical alignment, so the bubble moves to the left in
 *           Arabic. Colours, radius and type are tokens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1; STA-1371 (component gaps,
 *          owner approval 2026-10-31).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { AI_PARTS_KEYS } from "#core/constants/ai-parts-keys.constant";
import type { ChatMessageProps } from "#react/chat-message/chat-message.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Shimmer } from "#react/shimmer/shimmer";

/** The message's words. */
const K = AI_PARTS_KEYS.ui.chat_message;

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
  const author = <span className="sr-only">{authorLabel ?? t(from === "user" ? K.user : K.assistant)}</span>;
  const body = isLoading ? <Shimmer /> : children;
  if (from === "user") {
    return (
      <div
        data-slot="chat-message"
        data-from="user"
        className={cn("flex flex-col items-end gap-2", className) ?? ""}
      >
        {author}
        {attachments ? <div className="flex flex-wrap justify-end gap-2">{attachments}</div> : null}
        <div className="max-w-[80%] rounded-[var(--radius-container)] bg-default px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {body}
        </div>
        {actions}
      </div>
    );
  }
  return (
    <div
      data-slot="chat-message"
      data-from="assistant"
      className={cn("flex items-start gap-3 py-2", className) ?? ""}
    >
      {avatar ? <div className="shrink-0">{avatar}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-2 pe-12 text-sm leading-relaxed text-foreground">
        {author}
        {attachments ? <div className="flex flex-wrap gap-2">{attachments}</div> : null}
        <div>{body}</div>
        {actions}
      </div>
    </div>
  );
}
