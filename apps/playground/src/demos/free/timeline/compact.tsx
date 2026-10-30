/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the web Timeline: an audit log, one line per event.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Timeline, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { TIMELINE_KEYS } from "#src/demos/free/timeline/timeline-keys.constant";

const NOW = new Date("2026-10-29T12:00:00+03:00");

/** The demo's keys. */
const K = TIMELINE_KEYS.timeline.compact;

/** Timeline: an audit log, one line per event. */
export default function Compact() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Timeline
      label={t(K.label)}
      now={NOW}
      timeZone="Asia/Riyadh"
      variant="compact"
      items={[
        { id: "1", actor: "Noura", title: t(K.signed_in), at: "2026-10-29T11:58:00+03:00" },
        {
          id: "2",
          actor: "Noura",
          title: t(K.exported),
          at: "2026-10-29T11:40:00+03:00",
          icon: Icons.Download,
        },
        {
          id: "3",
          actor: "Faisal",
          title: t(K.role),
          at: "2026-10-29T10:02:00+03:00",
          tone: "warning",
          icon: Icons.Shield,
        },
        { id: "4", actor: "Faisal", title: t(K.signed_in), at: "2026-10-29T09:55:00+03:00" },
      ]}
    />
  );
}
