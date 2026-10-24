/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ProgressBar` takes: the shared progress props plus whether the bar draws its
 *          label and its value as text above the track. Each runtime's `ProgressBarProps` is this plus the runtime's own
 *          pass-through props.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (UI contract).
 */
import type { ProgressContractProps } from "#contracts/types/progress-contract-props.type";

/** Props shared by the web and native `ProgressBar`. */
export interface ProgressBarContractProps extends ProgressContractProps {
  /** True to draw the label above the track, at the inline start; it names the bar either way. Defaults to false. */
  readonly isLabelVisible?: boolean | undefined;
  /** True to draw the value text above the track, at the inline end; an indeterminate bar has none. Defaults to false. */
  readonly isValueVisible?: boolean | undefined;
}
