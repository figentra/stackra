/**
 * Stackra file contract:
 * Purpose: the "monthly" demo of the native RecurrenceEditor: a payroll report on the last Thursday of each month, six
 *          times; switch to "on day 26" or change how it ends.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (owner request 2026-10-29).
 */
import { CalendarDate } from "@internationalized/date";
import { RecurrenceEditor, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RECURRENCE_EDITOR_DEMO_KEYS } from "#src/demos/free/recurrence-editor/recurrence-editor-demo-keys.constant";

/** The demo's keys. */
const K = RECURRENCE_EDITOR_DEMO_KEYS.demo_free.recurrence_editor;

/** RecurrenceEditor: monthly, with an end. */
export default function Monthly() {
  const t = useCatalogueText(MESSAGES.en);
  const [rule, setRule] = useState("FREQ=MONTHLY;BYDAY=-1TH;COUNT=6");
  return (
    <View className="gap-4">
      <RecurrenceEditor
        label={t(K.monthly)}
        startDate={new CalendarDate(2026, 11, 26)}
        value={rule}
        onChange={setRule}
      />
      <Text type="small" tone="muted">{`${t(K.stored)} ${rule}`}</Text>
    </View>
  );
}
