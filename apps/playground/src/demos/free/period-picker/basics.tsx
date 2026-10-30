/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web PeriodPicker: the preset periods and "Custom range", with the value it hands
 *          back read under it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";
import { PeriodPicker, Text, useCatalogueText } from "@stackra/ui/react";
import type { PeriodValue } from "@stackra/ui/contracts";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PERIOD_PICKER_KEYS } from "#src/demos/free/period-picker/period-picker-keys.constant";

/** The demo's keys. */
const K = PERIOD_PICKER_KEYS.period_picker;
/** The demo's fixed today, so the presets read the same every visit. */
const TODAY = new CalendarDate(2026, 10, 29);

/** Period picker: basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [period, setPeriod] = useState<PeriodValue | null>(null);
  const range = period ? `\u2066${period.range.start} / ${period.range.end}\u2069` : "";
  return (
    <div className="grid gap-3">
      <PeriodPicker label={t(K.label)} today={TODAY} showComparison={false} onChange={setPeriod} />
      {period ? (
        <Text type="small" tone="muted">
          {t(K.showing, { range })}
        </Text>
      ) : null}
    </div>
  );
}
