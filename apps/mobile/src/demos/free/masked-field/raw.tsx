/**
 * Stackra file contract:
 * Purpose: the "raw" demo of the native MaskedField: a controlled commercial-registration number; the line under it shows the raw digits the field holds, without the separators.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C, owner request 2026-10-29).
 */
import { MaskedField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MASKED_FIELD_DEMO_KEYS } from "#src/demos/free/masked-field/masked-field-demo-keys.constant";

/** The demo's keys. */
const K = MASKED_FIELD_DEMO_KEYS.demo_free.masked_field.raw;

/** MaskedField: the raw value beside the masked one. */
export default function Raw() {
  const t = useCatalogueText(MESSAGES.en);
  const [value, setValue] = useState("1010123456");
  return (
    <View className="gap-2">
      <MaskedField
        label={t(K.label)}
        description={t(K.description)}
        mask="9999-999-999"
        value={value}
        onChange={setValue}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.held, { value })}
      </Text>
    </View>
  );
}
