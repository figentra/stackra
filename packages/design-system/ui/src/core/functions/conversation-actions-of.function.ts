/**
 * Stackra file contract:
 * Purpose: `conversationActionsOf(item, handlers, t)`, the row menu every runtime's ConversationList offers on a past
 *          conversation: pin or unpin, rename and delete, each only when the app gave its handler.
 * Boundary: pure; the runtimes draw the menu. An empty list means the row has no menu.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ConversationListContractProps } from "#contracts/types/conversation-list-contract-props.type";
import type { ConversationSummary } from "#contracts/types/conversation-summary.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/** The list's words. */
const K = AI_CHAT_KEYS.ui.conversation_list;

/**
 * The menu items of one conversation.
 * @param item - the conversation the menu acts on
 * @param handlers - the app's pin, rename and delete handlers; a missing one leaves its item out
 * @param t - the ui translator
 * @returns the items, in the order pin, rename, delete
 */
export function conversationActionsOf(
  item: ConversationSummary,
  {
    onPinChange,
    onRename,
    onDelete,
  }: Pick<ConversationListContractProps, "onPinChange" | "onRename" | "onDelete">,
  t: CatalogueText,
): MenuItem[] {
  return [
    ...(onPinChange
      ? [
          {
            id: "pin",
            label: t(item.isPinned ? K.unpin : K.pin),
            icon: item.isPinned ? ("pin-off" as const) : ("pin" as const),
            onPress: () => onPinChange(item.id, !item.isPinned),
          },
        ]
      : []),
    ...(onRename
      ? [
          {
            id: "rename",
            label: t(K.rename),
            icon: "pencil" as const,
            onPress: () => onRename(item.id),
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            id: "delete",
            label: t(K.delete),
            icon: "trash" as const,
            tone: "danger" as const,
            onPress: () => onDelete(item.id),
          },
        ]
      : []),
  ];
}
