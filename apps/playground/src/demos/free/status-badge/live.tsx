/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Status badge: Move the order to its next state. The badge changes on screen;
 *          nothing is announced, so a page that must announce a change uses a toast.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0304; WCAG 2.2 SC 1.4.1 (use of colour); ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Button, StatusBadge as UiStatusBadge, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_BADGE_KEYS } from "#src/demos/free/status-badge/status-badge-keys.constant";

/** The demo's keys. */
const K = STATUS_BADGE_KEYS.status_badge;

/** A realistic state for each tone. */
const STATE = {
  default: "Draft",
  accent: "Scheduled",
  success: "Active",
  warning: "Pending",
  danger: "Failed",
} as const satisfies Record<Tone, string>;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** Status badge: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [toneIndex, setToneIndex] = useState(0);

  const tone = Enum.values(Tone)[toneIndex] ?? "default";

  return (
    <div className={ROW}>
      <UiStatusBadge tone={tone}>{STATE[tone]}</UiStatusBadge>
      <Button
        variant="secondary"
        onPress={() => setToneIndex((index) => (index + 1) % Enum.values(Tone).length)}
      >
        {t(K.advance)}
      </Button>
    </div>
  );
}
