/**
 * Stackra file contract:
 * Purpose: `useRecordField(name, label, valueKind)`, a map form field of string keys as key and value rows, as the props
 *          its parts take: the section (its title and the map's error), each row's key field, its number or text value
 *          field and its remove button, and the add button; a row with an empty key is left out of the value.
 * Boundary: platform-free: imports `react` and `@stackra/ui/form`'s binding and no UI kit; the web and native form fields
 *           spread the props on their own kit's parts. The rows live here: a key being typed or renamed, or a second row
 *           with the same key, is not yet a valid map.
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { useTranslation } from "@stackra/i18n/react";
import { useSchemaField } from "@stackra/ui/form";
import { useState } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { fieldErrorOf } from "#core/functions/field-error-of.function";

/** One key and value row. */
type Row = readonly [string, unknown];

/** A labelled field's value and change. */
type Part<V> = {
  readonly label: string;
  readonly value: V;
  readonly onChange: (next: V) => void;
};

/**
 * The rows of the map at `name`.
 *
 * @example
 * const { section, rows, add } = useRecordField("labels", "Labels", "text");
 */
export function useRecordField(
  name: string,
  label: string,
  valueKind: "number" | "text",
): {
  readonly section: { readonly title: string; readonly description?: string };
  readonly rows: readonly ({
    readonly key: Part<string>;
    readonly remove: { readonly onPress: () => void; readonly children: string };
  } & (
    | { readonly number: Part<number | null>; readonly text?: undefined }
    | { readonly number?: undefined; readonly text: Part<string> }
  ))[];
  readonly add: { readonly onPress: () => void; readonly children: string };
} {
  const { t } = useTranslation();
  const field = useSchemaField<Readonly<Record<string, unknown>> | null | undefined>(name);
  const [rows, setRows] = useState<readonly Row[]>(() => Object.entries(field.value ?? {}));
  const change = (next: readonly Row[]) => {
    setRows(next);
    // shortcut: a repeated key keeps its last row's value; flag duplicates if a map ever needs it.
    field.onChange?.(Object.fromEntries(next.filter(([key]) => key.trim() !== "")));
  };
  const set = (index: number, row: Row) =>
    change(rows.map((other, at) => (at === index ? row : other)));
  const error = fieldErrorOf(field);
  return {
    section: { title: label, ...(error === undefined ? {} : { description: error }) },
    rows: rows.map(([key, value], index) => {
      const valueLabel = t(PANEL_KEYS.panel.resources.record_value, { number: index + 1 });
      return {
        key: {
          label: t(PANEL_KEYS.panel.resources.record_key, { number: index + 1 }),
          value: key,
          onChange: (next: string) => set(index, [next, value]),
        },
        ...(valueKind === "number"
          ? {
              number: {
                label: valueLabel,
                value: typeof value === "number" ? value : null,
                onChange: (next: number | null) => set(index, [key, next]),
              },
            }
          : {
              text: {
                label: valueLabel,
                value: typeof value === "string" ? value : "",
                onChange: (next: string) => set(index, [key, next]),
              },
            }),
        remove: {
          onPress: () => change(rows.filter((_, at) => at !== index)),
          children: t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 }),
        },
      };
    }),
    add: {
      onPress: () => change([...rows, ["", valueKind === "number" ? null : ""]]),
      children: t(PANEL_KEYS.panel.resources.add_item),
    },
  };
}
