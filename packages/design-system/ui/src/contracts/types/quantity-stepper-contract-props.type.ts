/**
 * Stackra file contract:
 * Purpose: the props every runtime's `QuantityStepper` takes: a compact minus, count, plus pill for a cart line or a seat count, whose minus can turn into a remove button at the minimum.
 * Boundary: types only. For typed numbers use NumberField.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web and native `QuantityStepper`. */
export interface QuantityStepperContractProps {
  /** The count, for a controlled stepper; pair it with `onChange`. */
  readonly value?: number | undefined;
  /** The count at the start, for an uncontrolled stepper. Defaults to `minValue`. */
  readonly defaultValue?: number | undefined;
  /** Called with the new count. */
  readonly onChange?: ((value: number) => void) | undefined;
  /** The lowest count. Defaults to 0. */
  readonly minValue?: number | undefined;
  /** The highest count. No limit when left out. */
  readonly maxValue?: number | undefined;
  /** How much one press changes the count. Defaults to 1. */
  readonly step?: number | undefined;
  /** The spoken name, for example "Quantity of flat white". */
  readonly label: string;
  /** Called when minus is pressed at the minimum; with it the minus shows a remove mark there. */
  readonly onRemove?: (() => void) | undefined;
  /** The accessible name of plus. Defaults to the catalogue's "Increase". */
  readonly incrementLabel?: string | undefined;
  /** The accessible name of minus. Defaults to the catalogue's "Decrease". */
  readonly decrementLabel?: string | undefined;
  /** The accessible name of minus while it removes. Defaults to the catalogue's "Remove". */
  readonly removeLabel?: string | undefined;
  /** The size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True to refuse both buttons. */
  readonly isDisabled?: boolean | undefined;
}
