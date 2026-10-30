/**
 * Stackra file contract:
 * Purpose: `CoachMarkProps`, the props of the web `CoachMark` in `coach-mark.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); GAPS.md row 39
 *          (owner decision 2026-10-28).
 */
import type { CoachMarkContractProps } from "#contracts/types/coach-mark-contract-props.type";

/** Props of the web CoachMark: the shared contract, with DOM elements as the steps' targets. */
export type CoachMarkProps = CoachMarkContractProps<Element>;
