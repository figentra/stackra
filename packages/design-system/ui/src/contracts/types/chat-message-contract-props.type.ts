/**
 * Stackra file contract:
 * Purpose: `ChatMessageContractProps`, the props every runtime's `ChatMessage` takes: one turn of a chat, the person's
 *          in a soft bubble at the reading end, the assistant's unboxed beside its avatar, with attachments and actions.
 * Boundary: types only; the text (plain or rendered Markdown) is the caller's children. The list around the turns is
 *           `MessageScroller`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (component gaps, owner approval
 *          2026-10-31).
 */
import type { ReactNode } from "react";

import type { ChatMessageFrom } from "#contracts/enums/chat-message-from.enum";

/** Props shared by the web and native `ChatMessage`. */
export interface ChatMessageContractProps {
  /** Who wrote it: `user` draws a bubble at the reading end, `assistant` an unboxed body beside the avatar. */
  readonly from: ChatMessageFrom;
  /** The message: text, or rendered Markdown, media or a `Reasoning` block. */
  readonly children?: ReactNode;
  /** The assistant's avatar, usually an `Avatar`; drawn for the assistant only. */
  readonly avatar?: ReactNode;
  /** Files sent with the message, usually `AttachmentCard`s. */
  readonly attachments?: ReactNode;
  /** The row under the message, usually `MessageActions`. */
  readonly actions?: ReactNode;
  /** True while the assistant has not written yet: a "Thinking…" shimmer stands in for the text. */
  readonly isLoading?: boolean | undefined;
  /** The author's name read before the message. Defaults to the catalogue's "You" or "Assistant". */
  readonly authorLabel?: string | undefined;
}
