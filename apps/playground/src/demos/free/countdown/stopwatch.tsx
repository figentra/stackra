/**
 * Stackra file contract:
 * Purpose: the "stopwatch" demo of the web Countdown: a support call's time, paused and resumed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, Countdown, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COUNTDOWN_KEYS } from "#src/demos/free/countdown/countdown-keys.constant";

/** The demo's keys. */
const K = COUNTDOWN_KEYS.countdown.stopwatch;

/** Countdown: a support call's time, paused and resumed. */
export default function Stopwatch() {
  const t = useCatalogueText(MESSAGES.en);
  const [isRunning, setRunning] = useState(true);
  return (
    <div className="grid justify-items-start gap-3">
      <Countdown mode="stopwatch" label={t(K.label)} isRunning={isRunning} />
      <Button variant="secondary" size="sm" onPress={() => setRunning(!isRunning)}>
        {t(isRunning ? K.pause : K.resume)}
      </Button>
    </div>
  );
}
