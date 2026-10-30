/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native TextField: an email field invalid until it has an at sign.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Text, TextField, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_DEMO_KEYS } from "#src/demos/free/text-field/text-field-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_DEMO_KEYS.demo_free.text_field.live;

/** The text typed so far shows beneath it. */
export default function Live() {
  const [email, setEmail] = useState("");
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <TextField
        label={t(K.label)}
        description={t(K.hint)}
        errorMessage={t(K.error)}
        type="email"
        isInvalid={email.length > 0 && !email.includes("@")}
        value={email}
        onChange={setEmail}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {email.length === 0 ? t(K.empty) : t(K.typed, { count: email.length, text: email })}
      </Text>
    </View>
  );
}
