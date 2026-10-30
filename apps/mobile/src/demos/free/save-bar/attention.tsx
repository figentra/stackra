/**
 * Stackra file contract:
 * Purpose: the "attention" demo of the native SaveBar: with unsaved changes, trying to leave shakes the bar and plays a warning haptic (a new `attentionKey`).
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, SaveBar, Text, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SAVE_BAR_DEMO_KEYS } from "#src/demos/free/save-bar/save-bar-demo-keys.constant";

/** The demo's keys. */
const K = SAVE_BAR_DEMO_KEYS.demo_free.save_bar;

/** Blocked navigation. */
export default function Attention() {
  const t = useCatalogueText(MESSAGES.en);
  const [name, setName] = useState("");
  const [attempts, setAttempts] = useState(0);
  const isDirty = name !== "";
  return (
    <View className="gap-4">
      <TextField
        label={t(K.product_name)}
        placeholder={t(K.sample_product)}
        value={name}
        onChange={setName}
      />
      <View className="flex-row">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => isDirty && setAttempts((count) => count + 1)}
        >
          {t(K.leave)}
        </Button>
      </View>
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {isDirty && attempts > 0 ? t(K.blocked) : ""}
      </Text>
      <SaveBar
        isDirty={isDirty}
        attentionKey={attempts}
        onDiscard={() => setName("")}
        onSave={() => setName("")}
      />
    </View>
  );
}
