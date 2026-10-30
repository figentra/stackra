/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Press feedback: the same tile with each answer to a press.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { PressFeedbackKind } from "@stackra/ui/contracts";
import { Card, PressFeedback, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PRESS_FEEDBACK_DEMO_KEYS } from "#src/demos/free/press-feedback/press-feedback-demo-keys.constant";

/** The demo's keys. */
const K = PRESS_FEEDBACK_DEMO_KEYS.demo_free.press_feedback.sample;

const KINDS: readonly PressFeedbackKind[] = ["scale", "highlight", "ripple"];

/** Press feedback: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  return (
    <View className="gap-3">
      {KINDS.map((kind) => (
        <PressFeedback
          key={kind}
          feedback={kind}
          onPress={() => setCount((value) => value + 1)}
          className="overflow-hidden rounded-2xl"
        >
          <Card className="gap-1 p-4">
            <Text type="caption" tone="muted">
              {t(K[kind])}
            </Text>
            <Text className="font-semibold">{t(K.sales)}</Text>
            <Text>{t(K.value)}</Text>
          </Card>
        </PressFeedback>
      ))}
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {t(K.pressed, { count })}
      </Text>
    </View>
  );
}
