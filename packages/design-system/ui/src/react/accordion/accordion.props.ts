/**
 * Stackra file contract:
 * Purpose: `AccordionProps`, the props of the web `Accordion` in `accordion.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0313 (decisions 1 and 2); WAI-ARIA 1.2 accordion pattern; owner decision 6
 *          of STA-350 (thin wrappers).
 */
import type { AccordionRootProps } from "@heroui/react";
import type { AccordionContractProps } from "#contracts/types/accordion-contract-props.type";

/**
 * Props of the web Accordion: the shared contract plus HeroUI v3's own accordion props, passed through unchanged.
 * The sections are `items`, never children, and `canExpandMultiple` is HeroUI's `allowsMultipleExpanded`.
 */
export type AccordionProps = AccordionContractProps &
  Omit<
    AccordionRootProps,
    keyof AccordionContractProps | "children" | "allowsMultipleExpanded" | "onExpandedChange"
  >;
