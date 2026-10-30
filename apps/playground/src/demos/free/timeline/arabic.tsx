/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Timeline: in Arabic the line runs down the right; Latin names keep their order.
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
const K = TIMELINE_KEYS.timeline.arabic;

/** Timeline: in Arabic the line runs down the right; Latin names keep their order. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <Timeline
        label={t(K.label)}
        now={NOW}
        timeZone="Asia/Riyadh"
        items={[
          {
            id: "1",
            actor: "سارة القحطاني",
            title: t(K.approved),
            at: "2026-10-29T10:30:00+03:00",
            icon: Icons.User,
            tone: "success",
          },
          {
            id: "2",
            actor: "Omar Haddad",
            title: t(K.edited),
            at: "2026-10-28T13:10:00+03:00",
            icon: Icons.Pencil,
            body: t(K.edited_body),
          },
        ]}
      />
    </div>
  );
}
