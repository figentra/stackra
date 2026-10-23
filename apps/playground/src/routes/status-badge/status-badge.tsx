/**
 * Stackra file contract:
 * Purpose: the page of the status-badge route: every tone with a realistic state in each size, a small table of
 *          records with a status column, and a live sample that moves a record through its states, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n. A status badge is never a live
 *          region, so the live sample changes the text on screen and announces nothing.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0304; WCAG 2.2 SC 1.4.1 (use of colour); ADR 0060 (light,
 *          dark, RTL).
 */
import { Size, Tone } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { StatusBadgeRoute } from "#src/routes/status-badge/status-badge.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::status-badge.*` keys.
const STRINGS = {
  documentTitle: `${StatusBadgeRoute.title} · Stackra Playground`,
  intro:
    "A StatusBadge shows the state of a record as text, with a dot in the state's tone before it. The text carries the meaning and keeps its contrast; the dot only repeats it in colour. It is never announced when it changes.",
  tones: "Tones and sizes",
  tonesNote: "One row per size, one badge per tone, each with a state that fits it.",
  size: (size: string) => `Size ${size}`,
  records: "In a table",
  recordsNote: "The status column of a list of records.",
  caption: "Orders",
  order: "Order",
  status: "Status",
  live: "Try it",
  liveNote:
    "Move the order to its next state. The badge changes on screen; nothing is announced, so a page that must announce a change uses a toast.",
  advance: "Next state",
} as const;

/** A realistic state for each tone. */
const STATE = {
  default: "Draft",
  accent: "Scheduled",
  success: "Active",
  warning: "Pending",
  danger: "Failed",
} as const satisfies Record<Tone, string>;

/** The orders of the table sample: a name and the tone of its state. */
const ORDERS = [
  { name: "Order 1040", tone: "success" },
  { name: "Order 1041", tone: "warning" },
  { name: "Order 1042", tone: "danger" },
  { name: "Order 1043", tone: "default" },
] as const;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-4";

/** The StatusBadge page. */
export function StatusBadge() {
  const [toneIndex, setToneIndex] = useState(0);
  const tone = Tone[toneIndex] ?? "default";

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{StatusBadgeRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection id="status-badge-tones" title={STRINGS.tones} note={STRINGS.tonesNote}>
        {Size.map((size) => (
          <div key={size} className="grid gap-2">
            <Ui.Heading level={3}>{STRINGS.size(size)}</Ui.Heading>
            <ul className={ROW}>
              {Tone.map((name) => (
                <li key={name}>
                  <Ui.StatusBadge tone={name} size={size}>
                    {STATE[name]}
                  </Ui.StatusBadge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </PageSection>

      <PageSection id="status-badge-table" title={STRINGS.records} note={STRINGS.recordsNote}>
        <table className="w-full max-w-md text-start">
          <caption className="sr-only">{STRINGS.caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-start text-sm font-semibold">
                {STRINGS.order}
              </th>
              <th scope="col" className="p-2 text-start text-sm font-semibold">
                {STRINGS.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((order) => (
              <tr key={order.name}>
                <th scope="row" className="p-2 text-start text-sm font-normal">
                  <bdi>{order.name}</bdi>
                </th>
                <td className="p-2">
                  <Ui.StatusBadge tone={order.tone}>{STATE[order.tone]}</Ui.StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageSection>

      <PageSection id="status-badge-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <div className={ROW}>
          <Ui.StatusBadge tone={tone}>{STATE[tone]}</Ui.StatusBadge>
          <Ui.Button
            variant="secondary"
            onPress={() => setToneIndex((index) => (index + 1) % Tone.length)}
          >
            {STRINGS.advance}
          </Ui.Button>
        </div>
      </PageSection>
    </article>
  );
}
