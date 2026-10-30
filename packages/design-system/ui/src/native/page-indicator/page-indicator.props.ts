/**
 * Stackra file contract:
 * Purpose: `PageIndicatorProps`, the props of the native `PageIndicator`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { PageIndicatorContractProps } from "#contracts/types/page-indicator-contract-props.type";

/** Props of the native PageIndicator. */
export type PageIndicatorProps = PageIndicatorContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
