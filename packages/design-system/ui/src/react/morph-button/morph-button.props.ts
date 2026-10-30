/**
 * Stackra file contract:
 * Purpose: `MorphButtonProps`, the props of the web `MorphButton` in `morph-button.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ButtonProps } from "#react/button/button.props";
import type { MorphButtonContractProps } from "#contracts/types/morph-button-contract-props.type";

/** Props of the web MorphButton: the shared contract plus the root's own props, passed through. */
export type MorphButtonProps = MorphButtonContractProps &
  Omit<
    ButtonProps,
    keyof MorphButtonContractProps | "children" | "label" | "isLoading" | "startIcon" | "endIcon"
  >;
