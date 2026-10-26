/**
 * Stackra file contract:
 * Purpose: `EntityPickerProps`, the props of the native `EntityPicker` in `entity-picker.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decisions 2 and 10); ADR 0055 (forms); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1,
 *          4.1.2, 4.1.3.
 */
import type { EntityPickerContractProps } from "#contracts/types/entity-picker-contract-props.type";

/** Props of the native EntityPicker: the shared contract in its single or multiple form. */
export type EntityPickerProps = EntityPickerContractProps & {
  /** The field's accessible name when the label is not a string. */
  readonly accessibilityLabel?: string | undefined;
  /** Styles the root, as on web. */
  readonly className?: string | undefined;
};
