/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Countdown: in Arabic the label reads from the right and the clock keeps its order.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Countdown, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COUNTDOWN_KEYS } from "#src/demos/free/countdown/countdown-keys.constant";

/** The demo's keys. */
const K = COUNTDOWN_KEYS.countdown.arabic;

/** Countdown: in Arabic the label reads from the right and the clock keeps its order. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  const [to] = useState(() => new Date(Date.now() + (3 * 3600 + 15 * 60) * 1000));
  return (
    <div dir="rtl" lang="ar">
      <Countdown label={t(K.label)} to={to} />
    </div>
  );
}
