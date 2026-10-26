/**
 * Stackra file contract:
 * Purpose: `StatusBadgeProps`, the props of the native `StatusBadge` in `status-badge.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0304 (decisions
 *          3 and 4); WCAG 2.2 SC 1.4.1.
 */
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";
import type { StatusBadgeContractProps } from "#contracts/types/status-badge-contract-props.type";
import type { ChipProps } from "#native/chip/chip.props";

/** Props of the native StatusBadge: the shared contract plus the Chip's pass-through props. */
export type StatusBadgeProps = StatusBadgeContractProps & Omit<ChipProps, keyof ChipContractProps>;
