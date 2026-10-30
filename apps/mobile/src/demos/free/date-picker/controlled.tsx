/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the native DatePicker: the page holds `isOpen`, so its own button opens it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, DatePicker, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_PICKER_DEMO_KEYS } from "#src/demos/free/date-picker/date-picker-demo-keys.constant";

/** The demo's keys. */
const K = DATE_PICKER_DEMO_KEYS.demo_free.date_picker.controlled;

/** Opened from outside, exactly as a popover would be. */
export default function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <DatePicker
        label={t(K.label)}
        calendarButtonLabel={t(K.button)}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
      <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
        {t(K.open)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(isOpen ? K.is_open : K.is_closed)}
      </Text>
    </View>
  );
}
