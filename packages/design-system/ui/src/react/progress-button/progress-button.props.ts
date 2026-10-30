/**
 * Stackra file contract:
 * Purpose: `ProgressButtonProps`, the props of the web `ProgressButton` in `progress-button.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ButtonProps } from "#react/button/button.props";
import type { ProgressButtonContractProps } from "#contracts/types/progress-button-contract-props.type";

/** Props of the web ProgressButton: the shared contract plus the root's own props, passed through. */
export type ProgressButtonProps = ProgressButtonContractProps &
  Omit<ButtonProps, keyof ProgressButtonContractProps | "isLoading">;
