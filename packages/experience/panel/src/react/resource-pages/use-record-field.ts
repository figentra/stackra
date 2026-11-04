/**
 * Stackra file contract:
 * Purpose: `useRecordField(name, valueKind)`, a map form field of string keys as key and value rows: the rows, the
 *          map's error text, and setting, adding and removing a row; a row with an empty key is left out of the value.
 * Boundary: platform-free: imports `react` and `@stackra/ui/form`'s binding and no UI kit; the web and native form fields
 *           draw the rows with their own kit. The rows live here: a key being typed or renamed, or a second row with the
 *           same key, is not yet a valid map.
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { useSchemaField } from "@stackra/ui/form";
import { useState } from "react";

import { fieldErrorOf } from "#core/functions/field-error-of.function";

/** One key and value row. */
type Row = readonly [string, unknown];

/**
 * The rows of the map at `name`.
 *
 * @example
 * const { rows, error, set, add, remove } = useRecordField("labels", "text");
 */
export function useRecordField(
  name: string,
  valueKind: "number" | "text",
): {
  readonly rows: readonly Row[];
  readonly error: string | undefined;
  readonly set: (index: number, row: Row) => void;
  readonly add: () => void;
  readonly remove: (index: number) => void;
} {
  const field = useSchemaField<Readonly<Record<string, unknown>> | null | undefined>(name);
  const [rows, setRows] = useState<readonly Row[]>(() => Object.entries(field.value ?? {}));
  const change = (next: readonly Row[]) => {
    setRows(next);
    // shortcut: a repeated key keeps its last row's value; flag duplicates if a map ever needs it.
    field.onChange?.(Object.fromEntries(next.filter(([key]) => key.trim() !== "")));
  };
  return {
    rows,
    error: fieldErrorOf(field),
    set: (index, row) => change(rows.map((other, at) => (at === index ? row : other))),
    add: () => change([...rows, ["", valueKind === "number" ? null : ""]]),
    remove: (index) => change(rows.filter((_, at) => at !== index)),
  };
}
