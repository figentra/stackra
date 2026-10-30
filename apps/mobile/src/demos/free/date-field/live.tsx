/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native DateField: the chosen day as an ISO date, set and cleared from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { getLocalTimeZone, today, type CalendarDate } from "@internationalized/date";
import { Button, DateField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_FIELD_DEMO_KEYS } from "#src/demos/free/date-field/date-field-demo-keys.constant";

/** The demo's keys. */
const K = DATE_FIELD_DEMO_KEYS.demo_free.date_field.live;

/** Pick a day, or set and clear it with the buttons. */
export default function Live() {
  const [day, setDay] = useState<CalendarDate | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <DateField label={t(K.label)} value={day} onChange={setDay} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {day === null ? t(K.none) : t(K.chosen, { day: day.toString() })}
      </Text>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => setDay(today(getLocalTimeZone()).add({ weeks: 1 }))}
      >
        {t(K.next)}
      </Button>
      <Button size="sm" variant="tertiary" onPress={() => setDay(null)}>
        {t(K.clear)}
      </Button>
    </View>
  );
}
