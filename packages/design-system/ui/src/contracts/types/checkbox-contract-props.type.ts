/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Checkbox` takes: the shared field props for a boolean (`value` is whether it is
 *          checked), the look, and the indeterminate state of a parent checkbox. Each runtime's `CheckboxProps` is
 *          this plus its HeroUI checkbox's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms).
 */
import type { ControlVariant } from "#contracts/enums/control-variant.enum";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `Checkbox`: a field that edits whether it is checked. */
export interface CheckboxContractProps extends FieldContractProps<boolean> {
  /** The look of the control; left out, each runtime picks the one that suits where it sits. */
  readonly variant?: ControlVariant | undefined;
  /** True to show the dash of a parent whose children are partly checked; a press still reports the new `value`. */
  readonly isIndeterminate?: boolean | undefined;
}
