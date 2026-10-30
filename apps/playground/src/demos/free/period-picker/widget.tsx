/**
 * Stackra file contract:
 * Purpose: the "widget" demo of the web PeriodPicker: the picker in a WidgetFrame's controls row, driving a revenue
 *          line whose previous-period twin is drawn while the comparison is on.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0307 (decision 17); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CalendarDate } from "@internationalized/date";
import { LineChart, PeriodPicker, WidgetFrame, useCatalogueText } from "@stackra/ui/react";
import type { PeriodValue } from "@stackra/ui/contracts";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PERIOD_PICKER_KEYS } from "#src/demos/free/period-picker/period-picker-keys.constant";

/** The demo's keys. */
const K = PERIOD_PICKER_KEYS.period_picker;
/** A week of revenue and the week before it. */
const DATA = [
  { day: "2026-10-23", revenue: 4200, previous: 3900 },
  { day: "2026-10-24", revenue: 3800, previous: 4100 },
  { day: "2026-10-25", revenue: 5100, previous: 4300 },
  { day: "2026-10-26", revenue: 4700, previous: 4000 },
  { day: "2026-10-27", revenue: 5600, previous: 4500 },
  { day: "2026-10-28", revenue: 6100, previous: 4800 },
  { day: "2026-10-29", revenue: 5900, previous: 5200 },
];

/** Period picker: in a widget. */
export default function Widget() {
  const t = useCatalogueText(MESSAGES.en);
  const [period, setPeriod] = useState<PeriodValue>({
    preset: "last_7_days",
    range: { start: new CalendarDate(2026, 10, 23), end: new CalendarDate(2026, 10, 29) },
  });
  return (
    <div className="grid w-full grid-cols-12 gap-4">
      <WidgetFrame
        title={t(K.revenue)}
        description={t(K.revenue_range)}
        size="full"
        controls={
          <PeriodPicker
            label={t(K.label)}
            today={new CalendarDate(2026, 10, 29)}
            value={period}
            onChange={setPeriod}
          />
        }
      >
        <LineChart
          data={DATA}
          xKey="day"
          xFormat={{ weekday: "short" }}
          series={[{ key: "revenue", label: t(K.revenue), compareKey: "previous" }]}
          showComparison={Boolean(period.compare)}
          label={t(K.revenue)}
        />
      </WidgetFrame>
    </div>
  );
}
