/**
 * Stackra file contract:
 * Purpose: `DateLabelProps`, the props of the web `DateLabel` in `date-label.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305 (rules
 *          10 and 12: one declaration per file).
 */
import type { DateLabelContractProps } from "#contracts/types/date-label-contract-props.type";
import type { ChipProps } from "#react/chip/chip.props";

/**
 * Props of the web DateLabel: the shared contract plus the Chip's own props. The label builds the children and picks
 * the tone from the state, so `children` and `tone` are refused.
 */
export type DateLabelProps = DateLabelContractProps &
  Omit<ChipProps, keyof DateLabelContractProps | "children" | "tone">;
