/**
 * Stackra file contract:
 * Purpose: one choice of a CheckboxGroup or a RadioGroup: the key it is chosen by, the label that names it, an
 *          optional description under the label, and whether it can be chosen at all.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary).
 */
import type { ReactNode } from "react";

/** One option of a group of checkboxes or radios. */
export interface ChoiceOption {
  /** The key the group reports when this option is chosen; unique inside the group. */
  readonly value: string;
  /** The visible text of the option, which is also its accessible name. */
  readonly label: ReactNode;
  /** Help text under the label, read out with the option. */
  readonly description?: ReactNode;
  /** True to refuse this option alone, while the others stay usable. */
  readonly isDisabled?: boolean | undefined;
}
