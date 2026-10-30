/**
 * Stackra file contract:
 * Purpose: the "rtl" demo of the web RecurrenceEditor: the editor in a right-to-left Arabic block: the weekdays start
 *          on Sunday and run from the right, and the fields line up from the right edge.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (RTL); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";
import { RecurrenceEditor, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RECURRENCE_EDITOR_KEYS } from "#src/demos/free/recurrence-editor/recurrence-editor-keys.constant";

/** The demo's keys. */
const K = RECURRENCE_EDITOR_KEYS.recurrence_editor.rtl;

/** RecurrenceEditor: right to left. */
export default function Rtl() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-lg">
      <RecurrenceEditor
        label={t(K.label)}
        startDate={new CalendarDate(2026, 11, 1)}
        defaultValue="FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,WE"
      />
    </div>
  );
}
