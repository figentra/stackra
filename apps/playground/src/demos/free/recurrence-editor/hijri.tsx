/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the web RecurrenceEditor: an offer every year on 1 Ramadan, counted in the Umm al-Qura
 *          calendar (RFC 7529 RSCALE), so it moves with the Hijri year; the end date's picker shows Hijri days.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); RFC 7529; ADR 0060 (light, dark,
 *          RTL); STA-1371 (owner request 2026-10-29).
 */
import { CalendarDate } from "@internationalized/date";
import { RecurrenceEditor, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RECURRENCE_EDITOR_KEYS } from "#src/demos/free/recurrence-editor/recurrence-editor-keys.constant";

/** The demo's keys. */
const K = RECURRENCE_EDITOR_KEYS.recurrence_editor;

/** RecurrenceEditor: Hijri calendar. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  const [rule, setRule] = useState("RSCALE=ISLAMIC-UMALQURA;FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=1");
  return (
    <div className="grid w-full max-w-lg gap-4">
      <RecurrenceEditor
        label={t(K.hijri.label)}
        calendar="islamic-umalqura"
        // 1 Ramadan 1447.
        startDate={new CalendarDate(2026, 2, 18)}
        value={rule}
        onChange={setRule}
      />
      <Text type="small" tone="muted">
        {t(K.stored)} <code dir="ltr">{rule}</code>
      </Text>
    </div>
  );
}
