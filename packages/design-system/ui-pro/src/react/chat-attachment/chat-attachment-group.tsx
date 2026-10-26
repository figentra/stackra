/**
 * Stackra file contract:
 * Purpose: the web `ChatAttachmentGroup` on HeroUI Pro's ChatAttachmentGroup: the row that holds the attachments of
 *          one message.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. HeroUI Pro's
 *          `ChatAttachmentGroup.Root` is left out of the compound, which is its root only. Imports the
 *          `chat-attachment` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { ChatAttachmentGroup as HeroChatAttachmentGroup } from "@heroui-pro/react/chat-attachment";

import type { ChatAttachmentGroupProps } from "#react/chat-attachment/chat-attachment-group.props";

/** The row of attachments of one message. */
export function ChatAttachmentGroup(props: ChatAttachmentGroupProps) {
  return <HeroChatAttachmentGroup.Root {...props} />;
}
