/**
 * Stackra file contract:
 * Purpose: `ResultContractProps`, the props every runtime's `Result` takes: the outcome page or panel after an action
 *          (paid, failed, submitted for review, still working), with a title, a description and the next actions.
 * Boundary: types only; the shared state props plus the `status` that picks the icon and tone.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */
import type { StateContractProps } from "#contracts/types/state-contract-props.type";

/** Props shared by the web and native `Result`. */
export interface ResultContractProps extends StateContractProps {
  /** `success`, `error`, `info` or `pending` (a spinner, announced politely). */
  readonly status: "success" | "error" | "info" | "pending";
}
