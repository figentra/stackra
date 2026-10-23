/**
 * Stackra file contract:
 * Purpose: one choice of a Select or ComboBox: its key, the text shown for it, an optional second line and whether it
 *          can be picked. The list of them is the `items` prop, so both runtimes draw the same choices from the same data.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary).
 */

/** One choice of a Select or ComboBox. */
export interface SelectItem {
  /** The key the field's value holds when this choice is picked; unique within the list. */
  readonly id: string;
  /** The text of the choice, shown in the list and in the field once picked; it is also what a ComboBox filters on. */
  readonly label: string;
  /** A second, muted line under the label, for example a code or an owner. */
  readonly description?: string | undefined;
  /** True to show the choice but refuse it. */
  readonly isDisabled?: boolean | undefined;
}
