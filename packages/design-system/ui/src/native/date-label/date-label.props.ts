/**
 * Stackra file contract:
 * Purpose: `DateLabelProps`, the props of the native `DateLabel` in `date-label.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 26 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305 (rules
 *          10 and 12: one declaration per file).
 */
import type { DateLabelContractProps } from "#contracts/types/date-label-contract-props.type";
import type { ChipProps } from "#native/chip/chip.props";

/**
 * Props of the native DateLabel: the shared contract plus the Chip's own props. The label builds the children, picks
 * the tone from the state and names itself, so `children`, `tone` and the accessible name are refused.
 */
export type DateLabelProps = DateLabelContractProps &
  Omit<
    ChipProps,
    | keyof DateLabelContractProps
    | "children"
    | "tone"
    | "accessible"
    | "accessibilityLabel"
    | "aria-label"
  >;
