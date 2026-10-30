/**
 * Stackra file contract:
 * Purpose: the "states" demo of the web DateLabel: a plain date, a due date that is far, soon and past, and a stock
 *          batch that expires soon and has expired, each in its state's tone and words.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { DateLabel, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { DATE_LABEL_KEYS } from "#src/demos/free/date-label/date-label-keys.constant";

/** The demo's keys. */
const K = DATE_LABEL_KEYS.date_label;

/** A day `offset` days from today. */
const dayFromToday = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date;
};

/** Each sample: its caption, its kind and its distance from today in days. */
const SAMPLES = [
  { caption: K.created, kind: "date", offset: -2 },
  { caption: K.invoice_far, kind: "due", offset: 14 },
  { caption: K.invoice_due_soon, kind: "due", offset: 2 },
  { caption: K.invoice_due, kind: "due", offset: -3 },
  { caption: K.batch_expiring, kind: "expiry", offset: 1 },
  { caption: K.batch_expired, kind: "expiry", offset: -10 },
] as const;

/** The DateLabel demo: states. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className="grid max-w-md gap-3">
      {SAMPLES.map(({ caption, kind, offset }) => (
        <li key={caption} className="flex items-center justify-between gap-4">
          <Text>{t(caption)}</Text>
          <DateLabel kind={kind} date={dayFromToday(offset)} />
        </li>
      ))}
    </ul>
  );
}
