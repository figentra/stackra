/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the native DateLabel: one promotion end date in the Gregorian and the Umm al-Qura Hijri
 *          calendar, as a Saudi market pack would set it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { DateLabel, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_DEMO_KEYS } from "#src/demos/free/date-label/date-label-demo-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_DEMO_KEYS.demo_free.date_label.hijri;

/** The promotion's last day: three weeks from today. */
const ENDS = new Date(Date.now() + 21 * 86_400_000);

/** The calendars side by side. */
const CALENDARS = [
  { caption: K.gregorian, calendar: "gregory" },
  { caption: K.hijri, calendar: "islamic-umalqura" },
] as const;

/** The same date in two calendars. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Text className="font-semibold">{t(K.promotion_ends)}</Text>
      {CALENDARS.map(({ caption, calendar }) => (
        <View key={calendar} className="flex-row items-center justify-between gap-3">
          <Text tone="muted">{t(caption)}</Text>
          <DateLabel kind="expiry" date={ENDS} calendar={calendar} isRelative={false} size="md" />
        </View>
      ))}
    </View>
  );
}
