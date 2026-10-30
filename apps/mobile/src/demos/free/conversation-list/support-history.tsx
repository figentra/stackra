/**
 * Stackra file contract:
 * Purpose: the "support-history" demo of the native ConversationList: a shop's assistant history, pinned refund
 *          on top, then today, yesterday, this week and older, one conversation open.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { ConversationList, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { CONVERSATION_LIST_DEMO_KEYS } from "#src/demos/free/conversation-list/conversation-list-demo-keys.constant";

/** The demo's keys. */
const K = CONVERSATION_LIST_DEMO_KEYS.demo_free.conversation_list.support_history;

/** A moment `minutes` minutes ago. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** ConversationList: Support history. */
export default function SupportHistory() {
  const t = useCatalogueText(MESSAGES.en);
  const [selectedId, setSelectedId] = useState<string>("return");
  const conversations = [
    {
      id: "refund",
      title: t(K.refund_title),
      preview: t(K.refund_preview),
      updatedAt: ago(20 * 1440),
      isPinned: true,
    },
    { id: "return", title: t(K.return_title), preview: t(K.return_preview), updatedAt: ago(40) },
    {
      id: "delivery",
      title: t(K.delivery_title),
      preview: t(K.delivery_preview),
      updatedAt: ago(180),
    },
    { id: "sizes", title: t(K.sizes_title), preview: t(K.sizes_preview), updatedAt: ago(1500) },
    { id: "gift", title: t(K.gift_title), preview: t(K.gift_preview), updatedAt: ago(3 * 1440) },
  ];
  return (
    <ConversationList
      label={t(K.label)}
      conversations={conversations}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );
}
