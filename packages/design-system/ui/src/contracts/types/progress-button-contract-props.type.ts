/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ProgressButton` takes: a Button that fills from the reading start as its action runs (an upload, a sync), refusing presses until it is done.
 * Boundary: types only. Without `progress` it is a plain Button.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";

/** Props shared by the web and native `ProgressButton`: the Button's, with the progress in place of `isLoading`. */
export interface ProgressButtonContractProps extends Omit<ButtonContractProps, "isLoading"> {
  /** How far the action has got, from 0 to 1; left out when nothing runs. Values outside are clamped. */
  readonly progress?: number | undefined;
  /** What a screen reader says with the percentage, for example "Uploading". Defaults to the label. */
  readonly progressLabel?: string | undefined;
}
