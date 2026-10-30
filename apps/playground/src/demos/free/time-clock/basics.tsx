/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web TimeClock: a pickup time on a 12-hour face, hours first and then minutes.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { TimeClock, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIME_CLOCK_KEYS } from "#src/demos/free/time-clock/time-clock-keys.constant";

/** The demo's keys. */
const K = TIME_CLOCK_KEYS.time_clock.basics;

/** A 12-hour clock face that starts at 3:30 PM. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return <TimeClock label={t(K.label)} hourCycle={12} defaultValue={{ hour: 15, minute: 30 }} />;
}
