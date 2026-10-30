/**
 * Stackra file contract:
 * Purpose: the native `ConversationList`: past AI conversations in groups (Pinned, Today, Yesterday, Previous 7 days,
 *          Older), each row its title, the last message's first words and how long ago it changed, one selected, and
 *          a menu to pin, rename or delete it; an empty state when there are none.
 * Boundary: group titles are headers and rows are buttons with their selected state, so a screen reader moves through
 *           them in order; the list does not scroll on its own (put it in the screen's ScrollView). Renaming and
 *           deleting are the app's.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1, 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { IconRegistryProvider } from "@stackra/icons/native";
import { useState, type ReactElement } from "react";
import { Pressable, View } from "react-native";

import type { ConversationSummary } from "#contracts/types/conversation-summary.type";
import type { MenuItem } from "#contracts/types/menu-item.type";
import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { groupConversations } from "#core/functions/group-conversations.function";
import { updatedAgoOf } from "#core/functions/updated-ago-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { ActionMenu } from "#native/action-menu/action-menu";
import { CONVERSATION_LIST_ICONS } from "#native/conversation-list/conversation-list-icons.constant";
import type { ConversationListProps } from "#native/conversation-list/conversation-list.props";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { EmptyState } from "#native/empty-state/empty-state";
import { Text } from "#native/text/text";

/** The list's words. */
const K = AI_CHAT_KEYS.ui.conversation_list;

/** Past conversations, grouped by day, one selected. */
export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onPinChange,
  onRename,
  onDelete,
  label,
  now: nowProp,
  className,
}: ConversationListProps): ReactElement {
  const t = useUiText();
  const { locale } = useDesignSystem();
  const [mountedAt] = useState(() => new Date());
  const now = nowProp ?? mountedAt;

  if (conversations.length === 0) {
    return (
      <IconRegistryProvider registry={CONVERSATION_LIST_ICONS}>
        <EmptyState
          icon="message-square"
          title={t(K.empty_title)}
          description={t(K.empty_description)}
        />
      </IconRegistryProvider>
    );
  }

  const itemsOf = (item: ConversationSummary): MenuItem[] => [
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

  return (
    <IconRegistryProvider registry={CONVERSATION_LIST_ICONS}>
      <View accessibilityLabel={label ?? t(K.label)} className={`gap-3 ${className ?? ""}`}>
        {groupConversations(conversations, now).map((group) => (
          <View key={group.id} className="gap-0.5">
            <Text type="caption" tone="muted" accessibilityRole="header" className="px-3 pb-1">
              {t(K[group.id])}
            </Text>
            {group.items.map((item) => {
              const items = itemsOf(item);
              const isSelected = item.id === selectedId;
              return (
                <View
                  key={item.id}
                  className={`flex-row items-center gap-1 pe-1 ${isSelected ? "bg-accent-soft" : ""}`}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => onSelect?.(item.id)}
                    className="min-h-11 flex-1 justify-center gap-0.5 py-2 ps-3"
                  >
                    <View className="flex-row items-baseline gap-2">
                      <Text isTruncated className="flex-1 font-medium">
                        {item.title}
                      </Text>
                      <Text type="caption" tone="muted">
                        {updatedAgoOf(new Date(item.updatedAt), now.getTime(), locale)}
                      </Text>
                    </View>
                    {item.preview ? (
                      <Text type="small" tone="muted" isTruncated>
                        {item.preview}
                      </Text>
                    ) : null}
                  </Pressable>
                  {items.length > 0 ? (
                    <ActionMenu
                      label={t(K.actions, { title: item.title })}
                      size="sm"
                      sections={[
                        {
                          id: "actions",
                          title: t(K.actions, { title: item.title }),
                          isTitleHidden: true,
                          items,
                        },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </IconRegistryProvider>
  );
}
