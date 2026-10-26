/**
 * Stackra file contract:
 * Purpose: `FloatingTableOfContentsItemProps`, props of an item: the shared contract plus HeroUI Pro's own, with
 *          `active` renamed `isActive`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (no
 *                     abbreviations); STA-416 FR-004.
 */
import type { FloatingTocItemProps as HeroFloatingTocItemProps } from "@heroui-pro/react/floating-toc";

import type { FloatingTableOfContentsItemContractProps } from "#contracts/types/floating-table-of-contents-item-contract-props.type";

/** Props of an item: the shared contract plus HeroUI Pro's own, with `active` renamed `isActive`. */
export type FloatingTableOfContentsItemProps = FloatingTableOfContentsItemContractProps &
  Omit<HeroFloatingTocItemProps, keyof FloatingTableOfContentsItemContractProps | "active">;
