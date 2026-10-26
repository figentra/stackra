/**
 * Stackra file contract:
 * Purpose: `NavigationHeaderProps`, the props of the web `NavigationHeader` in `navigation-header.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, decision 5: adapted
 *          form); ADR 0303 (decision 7); ADR 0317 (decisions 1, 4, 5 and 7); ADR 0165 (HeroUI v3 on web); ADR 0060;
 *          WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import type { ComponentPropsWithRef } from "react";
import type { NavigationHeaderContractProps } from "#contracts/types/navigation-header-contract-props.type";

/**
 * Props of the web NavigationHeader: the shared contract plus the `header` element's own props, passed through. The
 * element's `aria-label` is the contract's `label` and its `title` attribute gives way to the contract's `title`, so
 * the type refuses the first and replaces the second.
 */
export type NavigationHeaderProps = NavigationHeaderContractProps &
  Omit<
    ComponentPropsWithRef<"header">,
    keyof NavigationHeaderContractProps | "aria-label" | "children"
  >;
