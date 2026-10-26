/**
 * Stackra file contract:
 * Purpose: `FloatingTableOfContentsTriggerProps`, props of the trigger: the shared contract plus HeroUI Pro's own,
 *          with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0231 (no
 *                     abbreviations); STA-416 FR-004.
 */
import type { FloatingTocTriggerProps as HeroFloatingTocTriggerProps } from "@heroui-pro/react/floating-toc";

import type { FloatingTableOfContentsTriggerContractProps } from "#contracts/types/floating-table-of-contents-trigger-contract-props.type";

/** Props of the trigger: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type FloatingTableOfContentsTriggerProps = FloatingTableOfContentsTriggerContractProps &
  Omit<
    HeroFloatingTocTriggerProps,
    keyof FloatingTableOfContentsTriggerContractProps | "aria-label"
  >;
