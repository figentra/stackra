/**
 * Stackra file contract:
 * Purpose: the props every runtime's `MoneyField` takes: the field contract over an amount in minor units (an integer:
 *          halalas, cents, fils; `null` for an empty field), the currency and an optional list to pick it from, the
 *          bounds and the step in minor units, and the NumberField look props it passes on.
 * Boundary: types only. The amount is held in minor units so money never meets a float; the field scales it by the
 *           currency's digits (`Intl`) to show and read it, in the provider's locale and its digits.
 * Runtime: isomorphic
 * Governing contract: gap inventory row 2 (owner decision 2026-10-28, "P1 + P2 core"); ADR 0302 (decision 3); ADR 0303
 *          (decision 7); ADR 0055 (forms: one field contract).
 */
import type { TextFieldVariant } from "#contracts/enums/text-field-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `MoneyField`. */
export interface MoneyFieldContractProps extends FieldContractProps<number | null> {
  /** The ISO 4217 code of the amount, for example "SAR" or "KWD". */
  readonly currency: string;
  /** The codes the user may switch between; with two or more, a currency picker shows beside the amount. */
  readonly currencies?: readonly string[] | undefined;
  /** Called with the new code when the user picks another currency. */
  readonly onCurrencyChange?: ((currency: string) => void) | undefined;
  /** The spoken name of the currency picker. Defaults to the `ui` catalogue's word in the active locale. */
  readonly currencyLabel?: string | undefined;
  /** Hint text drawn inside the empty input. */
  readonly placeholder?: string | undefined;
  /** The look of the field: `primary` on the page, `secondary` on a tinted surface. Defaults to `primary`. */
  readonly variant?: TextFieldVariant | undefined;
  /** True to fill the parent's width. Defaults to true. */
  readonly isFullWidth?: boolean | undefined;
  /** The smallest amount, in minor units. */
  readonly minValue?: number | undefined;
  /** The largest amount, in minor units; going past it shakes the field and keeps the largest. */
  readonly maxValue?: number | undefined;
  /** How far one stepper press moves the amount, in minor units. Defaults to one major unit. */
  readonly step?: number | undefined;
  /** False to hide the increment and decrement buttons. Defaults to true. */
  readonly hasSteppers?: boolean | undefined;
  /** The spoken name of the increment button. */
  readonly incrementLabel?: string | undefined;
  /** The spoken name of the decrement button. */
  readonly decrementLabel?: string | undefined;
}
