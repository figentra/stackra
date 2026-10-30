/**
 * Stackra file contract:
 * Purpose: `CascaderProps`, the props of the web `Cascader`: the shared contract, a name for a field without a label,
 *          the field's look and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import type { CascaderContractProps } from "#contracts/types/cascader-contract-props.type";

/** Props of the web Cascader. */
export type CascaderProps = CascaderContractProps & {
  /** The field's name for assistive technology when it has no visible label. */
  readonly "aria-label"?: string | undefined;
  /** `primary` on the page, `secondary` inside a card or surface. Defaults to `primary`. */
  readonly variant?: "primary" | "secondary" | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
};
