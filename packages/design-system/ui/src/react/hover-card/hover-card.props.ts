/**
 * Stackra file contract:
 * Purpose: `HoverCardProps`, the props of the web `HoverCard`: the shared contract and a class name for the card.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.13; STA-1371.
 */
import type { HoverCardContractProps } from "#contracts/types/hover-card-contract-props.type";

/** Props of the web HoverCard. */
export type HoverCardProps = HoverCardContractProps & {
  readonly className?: string | undefined;
};
