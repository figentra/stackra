/**
 * Stackra file contract:
 * Purpose: `FloatingPanelProps`, the props of the web `FloatingPanel`: the contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import type { FloatingPanelContractProps } from "#contracts/types/floating-panel-contract-props.type";

/** Props of the web FloatingPanel. */
export type FloatingPanelProps = FloatingPanelContractProps & {
  /** Styles the panel. */
  readonly className?: string | undefined;
};
