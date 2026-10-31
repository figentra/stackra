/**
 * Stackra file contract:
 * Purpose: `parseGridValue()`, the value a DataGrid cell takes from typed or pasted text, by its column's kind:
 *          numbers (Arabic digits and thousands commas allowed), booleans (true/false, yes/no, 1/0, نعم/لا), a select
 *          option by id or label, an ISO day (also `YYYY/MM/DD`), or text. Empty text is null.
 * Boundary: a pure function. Text that does not parse is returned as it is, so the grid keeps what the user pasted
 *           and shows it as invalid (`gridCellErrorOf` reports the type error).
 * Runtime: isomorphic
 * Governing contract: ADR 0317 amendment 2026-10-28 (wave 3d, DataGrid typed cells).
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { DataGridValue } from "#contracts/types/data-grid-value.type";
import { latinDigitsOf } from "#core/functions/latin-digits-of.function";

/** The words a boolean cell reads as true and as false, lower-cased. */
const TRUE_WORDS = new Set(["true", "yes", "y", "1", "x", "✓", "نعم"]);
const FALSE_WORDS = new Set(["false", "no", "n", "0", "لا"]);

/**
 * The cell value `text` stands for in `column`.
 * @param text - the typed or pasted text
 * @param column - the column the cell is in
 * @returns the typed value, null for empty text, or the text itself when it does not parse
 */
export function parseGridValue(text: string, column: CollectionColumn): DataGridValue {
  const trimmed = text.trim();
  if (trimmed === "") return column.type === "boolean" ? false : null;
  switch (column.type ?? "text") {
    case "number": {
      const plain = latinDigitsOf(trimmed).replaceAll(/[,\s ]/g, "");
      const number = Number(plain);
      return plain !== "" && Number.isFinite(number) ? number : trimmed;
    }
    case "boolean": {
      const word = trimmed.toLowerCase();
      if (TRUE_WORDS.has(word)) return true;
      if (FALSE_WORDS.has(word)) return false;
      return trimmed;
    }
    case "choice": {
      const word = trimmed.toLowerCase();
      const option = column.options?.find(
        (choice) => choice.id.toLowerCase() === word || choice.label.toLowerCase() === word,
      );
      return option ? option.id : trimmed;
    }
    case "date": {
      const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(latinDigitsOf(trimmed));
      if (!match) return trimmed;
      const [, year, month, day] = match;
      const iso = `${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`;
      // A day that rolls over (31 April) is not a day; month 13 or day 0 is an invalid Date, whose toISOString throws.
      const date = new Date(`${iso}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) ? iso : trimmed;
    }
    default: {
      return text;
    }
  }
}
