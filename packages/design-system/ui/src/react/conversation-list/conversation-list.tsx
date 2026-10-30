/**
 * Stackra file contract:
 * Purpose: the web `ConversationList`: past AI conversations in groups (Pinned, Today, Yesterday, Previous 7 days,
 *          Older), each row its title, the last message's first words and how long ago it changed, one selected, and
 *          a menu to pin, rename or delete it; an empty state when there are none.
 * Boundary: a React Aria GridList with sections, so arrow keys move through every row across the groups, Enter or a
 *           click selects, and Right arrow reaches the row's menu button. Renaming and deleting are the app's.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useState, type ReactElement } from "react";
import {
  GridList,
  GridListHeader,
  GridListItem,
  GridListSection,
  useLocale,
} from "react-aria-components";

import type { ConversationSummary } from "#contracts/types/conversation-summary.type";
import { AI_CHAT_KEYS } from "#core/constants/ai-chat-keys.constant";
import { conversationActionsOf } from "#core/functions/conversation-actions-of.function";
import { groupConversations } from "#core/functions/group-conversations.function";
import { updatedAgoOf } from "#core/functions/updated-ago-of.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { CONVERSATION_LIST_ICONS } from "#react/conversation-list/conversation-list-icons.constant";
import type { ConversationListProps } from "#react/conversation-list/conversation-list.props";
import { EmptyState } from "#react/empty-state/empty-state";
import { useUiText } from "#react/hooks/use-ui-text";

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
  const { locale } = useLocale();
  const [mountedAt] = useState(() => new Date());
  const now = nowProp ?? mountedAt;

  if (conversations.length === 0) {
    return (
      <IconRegistryProvider registry={CONVERSATION_LIST_ICONS}>
        <EmptyState
          icon="message-square"
          title={t(K.empty_title)}
          description={t(K.empty_description)}
          headingLevel={3}
        />
      </IconRegistryProvider>
    );
  }

  const itemsOf = (item: ConversationSummary) =>
    conversationActionsOf(item, { onPinChange, onRename, onDelete }, t);

  return (
    <IconRegistryProvider registry={CONVERSATION_LIST_ICONS}>
      <GridList
        aria-label={label ?? t(K.label)}
        selectionMode="single"
        selectedKeys={selectedId ? [selectedId] : []}
        onSelectionChange={(keys) => {
          const [key] = keys === "all" ? [] : [...keys];
          if (key !== undefined) onSelect?.(String(key));
        }}
        className={cn("flex flex-col gap-3 outline-none", className) ?? ""}
      >
        {groupConversations(conversations, now).map((group) => (
          <GridListSection key={group.id} id={group.id} className="flex flex-col gap-0.5">
            <GridListHeader className="px-3 pb-1 text-xs font-medium text-muted">
              {t(K[group.id])}
            </GridListHeader>
            {group.items.map((item) => {
              const items = itemsOf(item);
              return (
                <GridListItem
                  key={item.id}
                  id={item.id}
                  textValue={item.title}
                  style={{ borderRadius: "var(--radius-control)" }}
                  className={({ isSelected, isFocusVisible }) =>
                    cn(
                      "group flex cursor-pointer items-center gap-2 py-2 ps-3 pe-1 text-foreground outline-none transition-colors motion-reduce:transition-none",
                      isSelected ? "bg-accent-soft" : "hover:bg-default",
                      isFocusVisible && "outline-2 -outline-offset-2 outline-focus",
                    ) ?? ""
                  }
                >
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted">
                        {updatedAgoOf(new Date(item.updatedAt), now.getTime(), locale)}
                      </span>
                    </div>
                    {item.preview ? (
                      <span className="truncate text-xs text-muted">{item.preview}</span>
                    ) : null}
                  </div>
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
                </GridListItem>
              );
            })}
          </GridListSection>
        ))}
      </GridList>
    </IconRegistryProvider>
  );
}
