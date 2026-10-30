/**
 * Stackra file contract:
 * Purpose: `CoachMarkProps`, the props of the native `CoachMark` in `coach-mark.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); GAPS.md row 39
 *          (owner decision 2026-10-28).
 */
import type { View } from "react-native";

import type { CoachMarkContractProps } from "#contracts/types/coach-mark-contract-props.type";

/** Props of the native CoachMark: the shared contract, with views as the steps' targets. */
export type CoachMarkProps = CoachMarkContractProps<View>;
