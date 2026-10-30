/**
 * Stackra file contract:
 * Purpose: the "time" demo of the web Wheel picker: A time on wheels.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { Text, WheelTimePicker, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { WHEEL_PICKER_KEYS } from "#src/demos/free/wheel-picker/wheel-picker-keys.constant";

/** The demo's keys. */
const K = WHEEL_PICKER_KEYS.wheel_picker.time;

/** Wheel picker: A time on wheels. */
export default function Time() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-4">
      <Text className="font-medium">{t(K.twelve)}</Text>
      <WheelTimePicker
        label={t(K.label)}
        hourCycle={12}
        minuteStep={5}
        defaultValue={{ hour: 18, minute: 30 }}
      />
      <Text className="font-medium">{t(K.twenty_four)}</Text>
      <WheelTimePicker
        label={t(K.label)}
        hourCycle={24}
        minuteStep={15}
        defaultValue={{ hour: 9, minute: 0 }}
      />
    </div>
  );
}
