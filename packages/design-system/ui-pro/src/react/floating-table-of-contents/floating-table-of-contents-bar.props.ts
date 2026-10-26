/**
 * Stackra file contract:
 * Purpose: `FloatingTableOfContentsBarProps`, props of a bar: the shared contract plus HeroUI Pro's own, with `active`
 *          renamed `isActive`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (no
 *                     abbreviations); STA-416 FR-004.
 */
import type { FloatingTocBarProps as HeroFloatingTocBarProps } from "@heroui-pro/react/floating-toc";

import type { FloatingTableOfContentsBarContractProps } from "#contracts/types/floating-table-of-contents-bar-contract-props.type";

/** Props of a bar: the shared contract plus HeroUI Pro's own, with `active` renamed `isActive`. */
export type FloatingTableOfContentsBarProps = FloatingTableOfContentsBarContractProps &
  Omit<HeroFloatingTocBarProps, keyof FloatingTableOfContentsBarContractProps | "active">;
