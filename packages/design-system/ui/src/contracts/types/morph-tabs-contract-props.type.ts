/**
 * Stackra file contract:
 * Purpose: the props every runtime's `MorphTabs` takes: icon tabs where the chosen one grows into a pill with its words (a bottom bar, a compact switcher).
 * Boundary: types only. A tab list to assistive technology; every tab is named by its label.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { SegmentSelectionContractProps } from "#contracts/types/segment-selection-contract-props.type";

/** Props shared by the web and native `MorphTabs`. */
export type MorphTabsContractProps = SegmentSelectionContractProps;
