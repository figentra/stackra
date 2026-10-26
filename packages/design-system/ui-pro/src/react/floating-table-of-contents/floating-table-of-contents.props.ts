/**
 * Stackra file contract:
 * Purpose: `FloatingTableOfContentsProps`, props of the web FloatingTableOfContents: the shared contract plus HeroUI
 *          Pro's own, with `open` renamed `isOpen`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (no
 *                     abbreviations); STA-416 FR-004.
 */
import type { FloatingTocProps as HeroFloatingTocProps } from "@heroui-pro/react/floating-toc";

import type { FloatingTableOfContentsContractProps } from "#contracts/types/floating-table-of-contents-contract-props.type";

/** Props of the web FloatingTableOfContents: the shared contract plus HeroUI Pro's own, with `open` renamed `isOpen`. */
export type FloatingTableOfContentsProps = FloatingTableOfContentsContractProps &
  Omit<HeroFloatingTocProps, keyof FloatingTableOfContentsContractProps | "open">;
