/**
 * Stackra file contract:
 * Purpose: the "hijri" demo of the web DateLabel: one promotion end date written in the Gregorian and the Umm al-Qura
 *          Hijri calendar, as a Saudi market pack would set it; hover a label for the full date.
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

/** The promotion's last day: three weeks from today. */
const ENDS = new Date(Date.now() + 21 * 86_400_000);

/** The calendars side by side. */
const CALENDARS = [
  { caption: K.gregorian, calendar: "gregory" },
  { caption: K.hijri, calendar: "islamic-umalqura" },
] as const;

/** The DateLabel demo: hijri. */
export default function Hijri() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid max-w-md gap-3">
      <Text className="font-semibold">{t(K.promotion_ends)}</Text>
      <ul className="grid gap-2">
        {CALENDARS.map(({ caption, calendar }) => (
          <li key={calendar} className="flex items-center justify-between gap-4">
            <Text tone="muted">{t(caption)}</Text>
            <DateLabel kind="expiry" date={ENDS} calendar={calendar} isRelative={false} size="md" />
          </li>
        ))}
      </ul>
    </div>
  );
}
