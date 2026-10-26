/**
 * Stackra file contract:
 * Purpose: `HoverCardContentProps`, props of `HoverCard.Content`: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { HoverCardContentProps as HeroHoverCardContentProps } from "@heroui-pro/react/hover-card";

import type { HoverCardContentContractProps } from "#contracts/types/hover-card-content-contract-props.type";

/** Props of `HoverCard.Content`: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type HoverCardContentProps = HoverCardContentContractProps &
  Omit<HeroHoverCardContentProps, keyof HoverCardContentContractProps | "aria-label">;
