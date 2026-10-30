/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native TextArea: a counted message that turns invalid past its limit.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Text, TextArea, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_AREA_DEMO_KEYS } from "#src/demos/free/text-area/text-area-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_AREA_DEMO_KEYS.demo_free.text_area.live;

/** The message's limit, in characters. */
const LIMIT = 40;

/** The count follows the text. */
export default function Live() {
  const [message, setMessage] = useState("");
  const t = useCatalogueText(MESSAGES.en);
  const isOver = message.length > LIMIT;
  return (
    <View className="gap-2">
      <TextArea
        label={t(K.label)}
        description={t(K.hint)}
        errorMessage={t(K.error, { limit: LIMIT })}
        isInvalid={isOver}
        value={message}
        onChange={setMessage}
      />
      <Text tone={isOver ? "danger" : "muted"} accessibilityLiveRegion="polite">
        {t(K.count, { count: message.length, limit: LIMIT })}
      </Text>
    </View>
  );
}
