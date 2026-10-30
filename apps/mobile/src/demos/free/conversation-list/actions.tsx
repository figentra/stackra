/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native ConversationList: each row's menu pins, renames or deletes the
 *          conversation, with what happened written under the list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { ConversationList, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CONVERSATION_LIST_DEMO_KEYS } from "#src/demos/free/conversation-list/conversation-list-demo-keys.constant";

/** The demo's keys. */
const K = CONVERSATION_LIST_DEMO_KEYS.demo_free.conversation_list.actions;

/** A moment `minutes` minutes ago. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** ConversationList: Pin, rename and delete. */
export default function Actions() {
  const t = useCatalogueText(MESSAGES.en);
  const [conversations, setConversations] = useState(() => [
    {
      id: "return",
      title: t(K.return_title),
      preview: t(K.return_preview),
      updatedAt: ago(40),
      isPinned: false,
    },
    {
      id: "delivery",
      title: t(K.delivery_title),
      preview: t(K.delivery_preview),
      updatedAt: ago(1500),
      isPinned: false,
    },
    {
      id: "refund",
      title: t(K.refund_title),
      preview: t(K.refund_preview),
      updatedAt: ago(9 * 1440),
      isPinned: false,
    },
  ]);
  const [done, setDone] = useState("");
  const change = (id: string, patch: { title?: string; isPinned?: boolean }) =>
    setConversations((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  return (
    <View className="gap-3">
      <ConversationList
        conversations={conversations}
        onPinChange={(id, isPinned) => {
          change(id, { isPinned });
          setDone(t(isPinned ? K.pinned : K.unpinned));
        }}
        onRename={(id) => {
          change(id, { title: t(K.renamed) });
          setDone(t(K.renamed_done));
        }}
        onDelete={(id) => {
          setConversations((list) => list.filter((item) => item.id !== id));
          setDone(t(K.deleted));
        }}
      />
      {done ? (
        <Text tone="muted" type="small" accessibilityLiveRegion="polite">
          {done}
        </Text>
      ) : null}
    </View>
  );
}
