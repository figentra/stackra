/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Status badge: One row per size, one badge per tone, each with a state that
 *          fits it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0304; WCAG 2.2 SC 1.4.1 (use of colour); ADR 0060 (light, dark, RTL).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Size } from "@stackra/ui/contracts";
import { Heading, StatusBadge as UiStatusBadge, useCatalogueText } from "@stackra/ui/react";
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

/** Status badge: Tones and sizes. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <>
      {Size.map((size) => (
        <div key={size} className="grid gap-2">
          <Heading level={3}>{t(K.size, { size })}</Heading>
          <ul className={ROW}>
            {Enum.values(Tone).map((name) => (
              <li key={name}>
                <UiStatusBadge tone={name} size={size}>
                  {STATE[name]}
                </UiStatusBadge>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
