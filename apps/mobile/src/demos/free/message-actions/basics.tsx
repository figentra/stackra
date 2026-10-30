/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native MessageActions: a shop assistant's answer about a delivery, with copy,
 *          retry, edit and the thumbs under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { MessageActions, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MESSAGE_ACTIONS_DEMO_KEYS } from "#src/demos/free/message-actions/message-actions-demo-keys.constant";

/** The demo's keys. */
const K = MESSAGE_ACTIONS_DEMO_KEYS.demo_free.message_actions.basics;

/** Copy, retry and edit actions under an answer, with the last action shown below. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [done, setDone] = useState("");
  return (
    <View className="gap-1">
      <Text>{t(K.answer)}</Text>
      <MessageActions
        copyValue={t(K.answer)}
        onRetry={() => setDone(t(K.retried))}
        onEdit={() => setDone(t(K.edited))}
        onFeedbackChange={() => undefined}
      />
      {done ? (
        <Text tone="muted" type="small">
          {done}
        </Text>
      ) : null}
    </View>
  );
}
