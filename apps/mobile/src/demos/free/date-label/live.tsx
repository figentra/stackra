/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native DateLabel: move a purchase order's due date a day at a time and watch it go
 *          from due to due soon to overdue, with one pulse as it turns overdue.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { Button, DateLabel, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_DEMO_KEYS } from "#src/demos/free/date-label/date-label-demo-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_DEMO_KEYS.demo_free.date_label.live;

/** A day `offset` days from today. */
const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

/** Earlier and Later move the due date. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [offset, setOffset] = useState(5);
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-center gap-3" accessibilityLiveRegion="polite">
        <Text>{t(K.due_date)}</Text>
        <DateLabel kind="due" date={dayFromToday(offset)} size="md" />
      </View>
      <View className="flex-row gap-2">
        <Button size="sm" variant="secondary" onPress={() => setOffset(offset - 1)}>
          {t(K.earlier)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setOffset(offset + 1)}>
          {t(K.later)}
        </Button>
      </View>
    </View>
  );
}
