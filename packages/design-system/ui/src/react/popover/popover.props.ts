/**
 * Stackra file contract:
 * Purpose: `PopoverProps`, the props of the web `Popover` in `popover.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 2.1.2, 4.1.2.
 */
import type { PopoverContentProps } from "@heroui/react";
import type { PopoverContractProps } from "#contracts/types/popover-contract-props.type";

/** Props of the web Popover: the shared contract plus HeroUI v3's own popover content props, passed through. */
export type PopoverProps = PopoverContractProps &
  Omit<
    PopoverContentProps,
    keyof PopoverContractProps | "isNonModal" | "shouldCloseOnInteractOutside"
  >;
