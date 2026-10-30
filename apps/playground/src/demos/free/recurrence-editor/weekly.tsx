/**
 * Stackra file contract:
 * Purpose: the "weekly" demo of the web RecurrenceEditor: a stand-up on Sunday, Tuesday and Thursday; change the days,
 *          the interval or the frequency and read the stored RRULE text under the editor.
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

/** A weekly rule on three days, with the stored rule string shown below. */
export default function Weekly() {
  const t = useCatalogueText(MESSAGES.en);
  const [rule, setRule] = useState("FREQ=WEEKLY;BYDAY=SU,TU,TH");
  return (
    <div className="grid w-full max-w-lg gap-4">
      <RecurrenceEditor
        label={t(K.weekly.label)}
        startDate={new CalendarDate(2026, 11, 1)}
        value={rule}
        onChange={setRule}
      />
      <Text type="small" tone="muted">
        {t(K.stored)} <code dir="ltr">{rule}</code>
      </Text>
    </div>
  );
}
