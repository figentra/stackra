/**
 * Stackra file contract:
 * Purpose: `HoverCardProps`, props of the web HoverCard: the shared contract plus HeroUI Pro's own, with `open`
 *          renamed `isOpen`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { HoverCardProps as HeroHoverCardProps } from "@heroui-pro/react/hover-card";

import type { HoverCardContractProps } from "#contracts/types/hover-card-contract-props.type";

/** Props of the web HoverCard: the shared contract plus HeroUI Pro's own, with `open` renamed `isOpen`. */
export type HoverCardProps = HoverCardContractProps &
  Omit<HeroHoverCardProps, keyof HoverCardContractProps | "open">;
