/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Time picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { Text, TimePicker, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIME_PICKER_DEMO_KEYS } from "#src/demos/free/time-picker/time-picker-demo-keys.constant";

/** The demo's keys. */
const K = TIME_PICKER_DEMO_KEYS.demo_free.time_picker.basics;

/** Time picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [time, setTime] = useState<{ readonly hour: number; readonly minute: number } | null>({
    hour: 8,
    minute: 30,
  });
  return (
    <View className="gap-4">
      <TimePicker
        label={t(K.label)}
        pickerButtonLabel={t(K.button)}
        value={time}
        onChange={setTime}
        minuteStep={15}
      />
      <Text tone="muted">
        {time
          ? t(K.chosen, { hour: String(time.hour), minute: String(time.minute).padStart(2, "0") })
          : null}
      </Text>
    </View>
  );
}
