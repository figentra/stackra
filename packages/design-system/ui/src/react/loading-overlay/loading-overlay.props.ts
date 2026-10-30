/**
 * Stackra file contract:
 * Purpose: `LoadingOverlayProps`, the props of the web `LoadingOverlay`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { LoadingOverlayContractProps } from "#contracts/types/loading-overlay-contract-props.type";

/** Props of the web LoadingOverlay. */
export type LoadingOverlayProps = LoadingOverlayContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
