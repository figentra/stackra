/**
 * Stackra file contract:
 * Purpose: `useMoneyField(name, scale)`, a minor-unit amount form field entered in major units: the binding, the major
 *          value shown and the change that holds it back in minor units.
 * Boundary: platform-free: imports `@stackra/ui/form`'s binding and no UI kit; the web and native form fields draw it
 *           with their own number field in the currency's format.
 * Runtime: isomorphic
 * Governing contract: ADR 0220 (money in minor units); ADR 0055 (thin field adapters).
 */
import type { FormFieldBinding } from "@stackra/ui/contracts";
import { useSchemaField } from "@stackra/ui/form";

/**
 * The major-unit value and change of the amount at `name`.
 *
 * @example
 * const { field, value, onChange } = useMoneyField("totals.totalMinor", 100);
 */
export function useMoneyField(
  name: string,
  scale: number,
): {
  readonly field: FormFieldBinding<number | null>;
  readonly value: number | null;
  readonly onChange: (major: number | null) => void;
} {
  const field = useSchemaField<number | null>(name);
  return {
    field,
    value: typeof field.value === "number" ? field.value / scale : null,
    onChange: (major) =>
      field.onChange?.(
        typeof major === "number" && !Number.isNaN(major) ? Math.round(major * scale) : null,
      ),
  };
}
