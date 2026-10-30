/**
 * Stackra file contract:
 * Purpose: `TreeSelectProps`, the props of the web `TreeSelect` in `tree-select.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-1371 (wave C).
 */
import type { TreeSelectContractProps } from "#contracts/types/tree-select-contract-props.type";

/** Props of the web TreeSelect: the shared contract, a class name and the accessible name without a label. */
export type TreeSelectProps = TreeSelectContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The field's name for assistive technology when it has no visible `label`. */
  readonly "aria-label"?: string | undefined;
  /** The look of the trigger: `primary` on the page, `secondary` on a tinted surface. Defaults to `primary`. */
  readonly variant?: "primary" | "secondary" | undefined;
};
