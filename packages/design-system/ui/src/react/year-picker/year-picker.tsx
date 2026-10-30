/**
 * Stackra file contract:
 * Purpose: the web `YearPicker`: a grid of years (a React Aria list box in grid layout), the chosen one filled; in the
 *          Hijri option each year also shows the Hijri years it spans.
 * Boundary: arrow keys move in two dimensions, Enter or a press picks; the years are in the customer's digits. It
 *           scrolls the chosen year into view on mount.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0192; WCAG 2.2
 *          SC 2.1.1, 2.5.8, 4.1.2.
 */
import { cn } from "@heroui/react";
import { withDigits } from "@stackra/i18n";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type ReactElement } from "react";
import { ListBox, ListBoxItem, useLocale } from "react-aria-components";

import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { hijriYearsOf } from "#core/functions/hijri-years-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { yearsBetween } from "#core/functions/years-between.function";
import { useUiText } from "#react/hooks/use-ui-text";
import type { YearPickerProps } from "#react/year-picker/year-picker.props";

/** A grid of years. */
export function YearPicker({
  value,
  defaultValue,
  onChange,
  minYear,
  maxYear,
  calendar = "gregory",
  label,
  isDisabled,
  className,
}: YearPickerProps): ReactElement {
  const { locale } = useLocale();
  const numerals = useNumerals();
  const t = useUiText();
  const [thisYear] = useState(() => new Date().getFullYear());
  const [own, setOwn] = useState(defaultValue ?? null);
  const year = value === undefined ? own : value;
  const number = new Intl.NumberFormat(locale, { useGrouping: false });
  return (
    <ListBox
      aria-label={label ?? t(FORMS_KEYS.ui.year_picker.label)}
      layout="grid"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={year === null ? [] : [String(year)]}
      onSelectionChange={(keys) => {
        const [key] = keys === "all" ? [] : [...keys];
        if (key === undefined) return;
        if (value === undefined) setOwn(Number(key));
        onChange?.(Number(key));
      }}
      {...omitUndefined({ isDisabled })}
      {...(isDisabled ? { disabledKeys: "all" as never } : {})}
      className={
        cn(
          "grid max-h-72 grid-cols-3 gap-1 overflow-y-auto p-1 outline-none sm:grid-cols-4",
          className,
        ) ?? ""
      }
    >
      {yearsBetween(minYear ?? thisYear - 10, maxYear ?? thisYear + 10).map((each) => (
        <ListBoxItem
          key={each}
          id={String(each)}
          textValue={String(each)}
          className={({ isSelected, isFocusVisible }) =>
            cn(
              "grid min-h-10 cursor-pointer place-items-center rounded-[var(--radius-control)] px-2 py-1 text-center outline-none tabular-nums hover:bg-default",
              isSelected && "bg-accent text-accent-foreground hover:bg-accent",
              isFocusVisible && "outline-2 outline-focus",
              each === thisYear && !isSelected && "font-semibold text-accent-soft-foreground",
            ) ?? ""
          }
        >
          {({ isSelected }) => (
            <>
              <span>{withDigits(number.format(each), numerals)}</span>
              {calendar === "islamic-umalqura" ? (
                <span className={cn("text-xs", isSelected ? undefined : "text-muted") ?? ""}>
                  {withDigits(hijriYearsOf(each, locale), numerals)}
                </span>
              ) : null}
            </>
          )}
        </ListBoxItem>
      ))}
    </ListBox>
  );
}
