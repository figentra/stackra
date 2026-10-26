/**
 * Stackra file contract:
 * Purpose: `AccordionProps`, the props of the native `Accordion` in `accordion.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0313 (decisions 1 and 2); owner decision 6 of STA-350 (thin wrappers).
 */
import type { Accordion as HeroAccordion } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { AccordionContractProps } from "#contracts/types/accordion-contract-props.type";

/**
 * Props of the native Accordion: the shared contract plus HeroUI Native's own accordion props, passed through
 * unchanged. The sections are `items`, never children, and `canExpandMultiple` is HeroUI Native's `selectionMode`.
 */
export type AccordionProps = AccordionContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroAccordion>,
    | keyof AccordionContractProps
    | "children"
    | "selectionMode"
    | "value"
    | "defaultValue"
    | "onValueChange"
  >;
