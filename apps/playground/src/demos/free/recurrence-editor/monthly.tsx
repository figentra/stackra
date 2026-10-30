/**
 * Stackra file contract:
 * Purpose: the "monthly" demo of the web RecurrenceEditor: a payroll report on the last Thursday of each month, six
 *          times; switch to "on day 26" or change how it ends.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (owner request 2026-10-29).
 */
import { CalendarDate } from "@internationalized/date";
import { RecurrenceEditor, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RECURRENCE_EDITOR_KEYS } from "#src/demos/free/recurrence-editor/recurrence-editor-keys.constant";

/** The demo's keys. */
const K = RECURRENCE_EDITOR_KEYS.recurrence_editor;

/** RecurrenceEditor: monthly, with an end. */
export default function Monthly() {
  const t = useCatalogueText(MESSAGES.en);
  const [rule, setRule] = useState("FREQ=MONTHLY;BYDAY=-1TH;COUNT=6");
  return (
    <div className="grid w-full max-w-lg gap-4">
      <RecurrenceEditor
        label={t(K.monthly.label)}
        startDate={new CalendarDate(2026, 11, 26)}
        value={rule}
        onChange={setRule}
      />
      <Text type="small" tone="muted">
        {t(K.stored)} <code dir="ltr">{rule}</code>
      </Text>
    </div>
  );
}
