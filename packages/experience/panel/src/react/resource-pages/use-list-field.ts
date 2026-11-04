/**
 * Stackra file contract:
 * Purpose: `useListField(name, label, item)`, a list form field's rows bound by `name`, as the props its parts take: the
 *          section (its title and the list's error), each row's path and remove button, and the add button.
 * Boundary: platform-free: imports `@stackra/ui/form`'s binding and no UI kit; the web and native form fields spread the
 *           props on their own kit's parts, each row bound by index (`parcels.0.weight`).
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */
import { useTranslation } from "@stackra/i18n/react";
import { useSchemaField } from "@stackra/ui/form";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { fieldErrorOf } from "#core/functions/field-error-of.function";

/**
 * The rows of the list at `name`.
 *
 * @example
 * const { section, rows, add } = useListField("parcels", "Parcels", "object");
 */
export function useListField(
  name: string,
  label: string,
  item: "object" | "value",
): {
  readonly section: { readonly title: string; readonly description?: string };
  readonly rows: readonly {
    readonly path: string;
    readonly remove: { readonly onPress: () => void; readonly children: string };
  }[];
  readonly add: { readonly onPress: () => void; readonly children: string };
} {
  const { t } = useTranslation();
  const list = useSchemaField<readonly unknown[] | null | undefined>(name);
  const rows = Array.isArray(list.value) ? list.value : [];
  const error = fieldErrorOf(list);
  return {
    section: { title: label, ...(error === undefined ? {} : { description: error }) },
    rows: rows.map((_, index) => ({
      path: `${name}.${index}`,
      remove: {
        onPress: () => list.onChange?.(rows.filter((__, other) => other !== index)),
        children: t(PANEL_KEYS.panel.resources.remove_item, { number: index + 1 }),
      },
    })),
    add: {
      onPress: () => list.onChange?.([...rows, item === "object" ? {} : undefined]),
      children: t(PANEL_KEYS.panel.resources.add_item),
    },
  };
}
