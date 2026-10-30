/**
 * Stackra file contract:
 * Purpose: `SplitButtonProps`, the props of the web `SplitButton` in `split-button.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0312; owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ButtonGroupProps } from "@heroui/react";
import type { SplitButtonContractProps } from "#contracts/types/split-button-contract-props.type";

/**
 * Props of the web SplitButton: the shared contract plus HeroUI v3's own ButtonGroup props, passed through unchanged.
 * The two halves are the component's, so `children`, `orientation` and `fullWidth` are refused.
 */
export type SplitButtonProps = SplitButtonContractProps &
  Omit<ButtonGroupProps, keyof SplitButtonContractProps | "orientation" | "fullWidth">;
