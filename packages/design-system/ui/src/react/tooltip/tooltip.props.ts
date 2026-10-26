/**
 * Stackra file contract:
 * Purpose: `TooltipProps`, the props of the web `Tooltip` in `tooltip.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.4.13, 4.1.2.
 */
import type { TooltipRootProps } from "@heroui/react";
import type { TooltipContractProps } from "#contracts/types/tooltip-contract-props.type";

/** Props of the web Tooltip: the shared contract plus HeroUI v3's own tooltip root props, passed through. */
export type TooltipProps = TooltipContractProps &
  Omit<TooltipRootProps, keyof TooltipContractProps>;
