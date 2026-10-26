/**
 * Stackra file contract:
 * Purpose: `TooltipProps`, the props of the native `Tooltip` in `tooltip.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; WCAG 2.2 SC 4.1.2.
 */
import type { TooltipContractProps } from "#contracts/types/tooltip-contract-props.type";

/** Props of the native Tooltip: the shared contract only; there is no HeroUI Native tooltip to pass props to. */
export type TooltipProps = TooltipContractProps;
