/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native DateLabel: a plain date, a due date that is far, soon and past, and a stock
 *          batch that expires soon and has expired, each in its state's tone and words.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { DateLabel, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_DEMO_KEYS } from "#src/demos/free/date-label/date-label-demo-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_DEMO_KEYS.demo_free.date_label.states;

/** A day `offset` days from today. */
const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

/** Each sample: its caption, its kind and its distance from today in days. */
const SAMPLES = [
  { caption: K.created, kind: "date", offset: -2 },
  { caption: K.invoice_far, kind: "due", offset: 14 },
  { caption: K.invoice_due_soon, kind: "due", offset: 2 },
  { caption: K.invoice_due, kind: "due", offset: -3 },
  { caption: K.batch_expiring, kind: "expiry", offset: 1 },
  { caption: K.batch_expired, kind: "expiry", offset: -10 },
] as const;

/** Every state, beside what it labels. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {SAMPLES.map(({ caption, kind, offset }) => (
        <View key={caption} className="flex-row items-center justify-between gap-3">
          <Text className="flex-1">{t(caption)}</Text>
          <DateLabel kind={kind} date={dayFromToday(offset)} />
        </View>
      ))}
    </View>
  );
}
