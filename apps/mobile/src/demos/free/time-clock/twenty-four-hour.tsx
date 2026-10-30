/**
 * Stackra file contract:
 * Purpose: the "twenty-four-hour" demo of the native TimeClock: a kitchen's opening time on a 24-hour face (00 and 13
 *          to 23 on the inner ring), the minutes in steps of five.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { TimeClock, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIME_CLOCK_DEMO_KEYS } from "#src/demos/free/time-clock/time-clock-demo-keys.constant";

/** The demo's keys. */
const K = TIME_CLOCK_DEMO_KEYS.demo_free.time_clock.twenty_four_hour;

/** TimeClock: 24 hours. */
export default function TwentyFourHour() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-center">
      <TimeClock
        label={t(K.label)}
        hourCycle={24}
        minuteStep={5}
        defaultValue={{ hour: 18, minute: 0 }}
      />
    </View>
  );
}
