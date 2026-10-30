/**
 * Stackra file contract:
 * Purpose: the "compare" demo of the web PeriodPicker: this quarter compared with the previous one; the switch reads
 *          the comparison range and the mode Select turns it into the same quarter last year.
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

/** Period picker: compare. */
export default function Compare() {
  const t = useCatalogueText(MESSAGES.en);
  const [period, setPeriod] = useState<PeriodValue>({
    preset: "this_quarter",
    range: { start: new CalendarDate(2026, 10, 1), end: new CalendarDate(2026, 12, 31) },
    compare: {
      mode: "previous",
      range: { start: new CalendarDate(2026, 7, 1), end: new CalendarDate(2026, 9, 30) },
    },
  });
  const compare = period.compare;
  return (
    <div className="grid gap-3">
      <PeriodPicker
        label={t(K.label)}
        today={new CalendarDate(2026, 10, 29)}
        value={period}
        onChange={setPeriod}
      />
      <Text type="small" tone="muted">
        {compare
          ? t(K.comparing, { range: `\u2066${compare.range.start} / ${compare.range.end}\u2069` })
          : t(K.nothing)}
      </Text>
    </div>
  );
}
