/**
 * Stackra file contract:
 * Purpose: the words a filter chip shows for its value, in the user's locale: the text itself, the label of the chosen
 *          option or the first few labels of several, a number range with `Intl.NumberFormat` and the filter's own
 *          format, a day range with `Intl.DateTimeFormat`, and the yes or no words of a boolean. Web and native draw the
 *          same sentence, so the page is one thing to read on either.
 * Boundary: pure; internal, not in the `.` barrel. It returns only the value part: the chip puts the filter's label
 *           before it. A filter with no value, or one that filters nothing, gives an empty string (the chip of an
 *           editor still open shows its label alone). The words (yes, no, from, until) come from the caller, which
 *           translates them (`ui::filter_bar.*`). A `CalendarDate` is formatted as that calendar day in UTC, so the day never shifts with
 *           the time zone of the device.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decision 3); ADR 0060 (right-to-left).
 */
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import { filterValueOfKind } from "#core/functions/filter-value-of-kind.function";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import type { FilterChipWords } from "#core/types/filter-chip-words.type";

/** How many chosen options a chip names before it counts the rest. */
const NAMED_CHOICES = 2;

/**
 * The labels as one list in `locale`. Hermes (React Native) has no `Intl.ListFormat`, so there the labels are joined
 * with commas, which is what the English narrow list gives.
 */
const listOf = (labels: readonly string[], locale: string): string =>
  typeof Intl.ListFormat === "function"
    ? new Intl.ListFormat(locale, { type: "conjunction", style: "narrow" }).format(labels)
    : labels.join(", ");

/**
 * Says what a filter chip shows for the filter's value.
 * @param definition - the filter, which tells the kind, the options, the number format and the boolean words
 * @param value - what the query holds under the filter's `id`, or `undefined` when it holds nothing
 * @param locale - the BCP 47 locale to format numbers, days and lists in
 * @param words - the translated yes, no, from and until words
 * @returns the value as a short phrase, or an empty string when the filter filters nothing
 */
export function filterChipTextOf(
  definition: FilterDefinition,
  value: FilterValue | undefined,
  locale: string,
  words: FilterChipWords,
): string {
  if (value === undefined || isFilterValueEmpty(value)) return "";
  switch (definition.kind) {
    case "text":
      return (filterValueOfKind("text", value) ?? "").trim();
    case "select": {
      const id = filterValueOfKind("select", value);
      return definition.options.find((option) => option.id === id)?.label ?? id ?? "";
    }
    case "multi-select": {
      const ids = filterValueOfKind("multi-select", value) ?? [];
      const labels = ids.map(
        (id) => definition.options.find((option) => option.id === id)?.label ?? id,
      );
      if (labels.length <= NAMED_CHOICES) return listOf(labels, locale);
      return `${labels.slice(0, NAMED_CHOICES).join(", ")} +${labels.length - NAMED_CHOICES}`;
    }
    case "number": {
      const range = filterValueOfKind("number", value);
      if (!range) return "";
      const format = new Intl.NumberFormat(locale, definition.formatOptions);
      if (range.min !== null && range.max !== null) {
        return `${format.format(range.min)} – ${format.format(range.max)}`;
      }
      return range.min !== null
        ? `≥ ${format.format(range.min)}`
        : `≤ ${format.format(range.max ?? 0)}`;
    }
    case "date-range": {
      const range = filterValueOfKind("date-range", value);
      if (!range) return "";
      const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
      const start = range.start ? format.format(range.start.toDate("UTC")) : null;
      const end = range.end ? format.format(range.end.toDate("UTC")) : null;
      if (start !== null && end !== null) return `${start} – ${end}`;
      return start !== null ? `${words.from} ${start}` : `${words.until} ${end ?? ""}`;
    }
    case "boolean":
      return filterValueOfKind("boolean", value)
        ? (definition.trueLabel ?? words.yes)
        : (definition.falseLabel ?? words.no);
  }
}
