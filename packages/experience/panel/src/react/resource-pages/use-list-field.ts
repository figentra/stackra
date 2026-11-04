/**
 * Stackra file contract:
 * Purpose: `useListField(name)`, a list form field's rows bound by `name`: the rows, the list's error text, and adding
 *          and removing a row.
 * Boundary: platform-free: imports `@stackra/ui/form`'s binding and no UI kit; the web and native form fields draw the
 *           rows with their own kit, each bound by index (`parcels.0.weight`).
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { useSchemaField } from "@stackra/ui/form";

import { fieldErrorOf } from "#core/functions/field-error-of.function";

/**
 * The rows of the list at `name`.
 *
 * @example
 * const { rows, error, add, remove } = useListField("parcels");
 */
export function useListField(name: string): {
  readonly rows: readonly unknown[];
  readonly error: string | undefined;
  readonly add: (item: "object" | "value") => void;
  readonly remove: (index: number) => void;
} {
  const list = useSchemaField<readonly unknown[] | null | undefined>(name);
  const rows = Array.isArray(list.value) ? list.value : [];
  return {
    rows,
    error: fieldErrorOf(list),
    add: (item) => list.onChange?.([...rows, item === "object" ? {} : undefined]),
    remove: (index) => list.onChange?.(rows.filter((_, other) => other !== index)),
  };
}
