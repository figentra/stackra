/**
 * Stackra file contract:
 * Purpose: the "with-field" demo of the web TimeClock: the clock and a TimeField share one time, so a person can type
 *          it or set it on the face; minutes in quarter hours.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { TimeClock, TimeField, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIME_CLOCK_KEYS } from "#src/demos/free/time-clock/time-clock-keys.constant";

/** The demo's keys. */
const K = TIME_CLOCK_KEYS.time_clock.with_field;

/** TimeClock: with a field. */
export default function WithField() {
  const t = useCatalogueText(MESSAGES.en);
  const [time, setTime] = useState({ hour: 9, minute: 15 });
  return (
    <div className="flex flex-wrap items-start gap-6">
      <TimeField
        className="w-48"
        label={t(K.field)}
        value={time}
        onChange={(next) => {
          if (next) setTime({ hour: next.hour, minute: next.minute });
        }}
      />
      <TimeClock label={t(K.label)} minuteStep={15} value={time} onChange={setTime} />
    </div>
  );
}
