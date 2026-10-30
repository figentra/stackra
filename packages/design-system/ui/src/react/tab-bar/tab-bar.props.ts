/**
 * Stackra file contract:
 * Purpose: `TabBarProps`, the props of the web `TabBar`: the shared contract, where it sits, and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { TabBarContractProps } from "#contracts/types/tab-bar-contract-props.type";

/** Props of the web TabBar. */
export type TabBarProps = TabBarContractProps & {
  /** `fixed` (the default) pins it to the bottom of the viewport on small screens; `static` keeps it in the flow. */
  readonly position?: "fixed" | "static" | undefined;
  /** Styles the bar. */
  readonly className?: string | undefined;
};
