/**
 * Stackra file contract:
 * Purpose: `TamoDateAsk`, natural-language dates in a date picker's popover: the person writes "next Friday" or
 *          "last month", Tamo proposes the day or the range, shown in full in the active locale, and Apply picks it.
 * Boundary: internal to DatePicker and DateRangePicker. A proposal outside the ISO calendar-day form is refused as
 *           nothing found; the picker's own bounds still apply to what is picked.
 * Runtime: browser
 * Governing contract: ADR 0507 (natural-language dates); ADR 0021.
 */
import { parseDate } from "@internationalized/date";
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { TAMO_KEYS } from "#core/constants/tamo-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { TamoAskBox } from "#react/tamo-ask-box/tamo-ask-box";
import type { TamoDateAskProps } from "#react/date-picker/tamo-date-ask.props";

/** An ISO calendar day. */
const DAY = /^\d{4}-\d{2}-\d{2}$/u;

/** A day or a range from words. */
export function TamoDateAsk({ slot, isRange, today, onPick }: TamoDateAskProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  const format = (iso: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(
      new Date(`${iso}T12:00:00Z`),
    );
  return (
    <TamoAskBox<{ readonly start: string; readonly end?: string | undefined }>
      placeholder={t(
        isRange ? TAMO_KEYS.ui.tamo.date_range_placeholder : TAMO_KEYS.ui.tamo.date_placeholder,
      )}
      onAsk={async (text, signal) => {
        const proposal = await slot.run(
          "date",
          { text, locale, today: today.toString(), isRange },
          signal,
        );
        const isDay = (value: string | undefined) => value === undefined || DAY.test(value);
        return proposal && DAY.test(proposal.start) && isDay(proposal.end) ? proposal : null;
      }}
      renderProposal={(proposal) => (
        <p className="m-0 text-sm font-medium">
          {proposal.end
            ? `${format(proposal.start)} – ${format(proposal.end)}`
            : format(proposal.start)}
        </p>
      )}
      onApply={(proposal) =>
        onPick(parseDate(proposal.start), proposal.end ? parseDate(proposal.end) : undefined)
      }
    />
  );
}
