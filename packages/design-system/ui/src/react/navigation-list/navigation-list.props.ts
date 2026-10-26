/**
 * Stackra file contract:
 * Purpose: `NavigationListProps`, the props of the web `NavigationList` in `navigation-list.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          1, 5 and 7); ADR 0317 (decisions 1, 3 and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 1.3.1, 1.4.1, 2.4.7,
 *          2.5.8 and 4.1.2.
 */
import type { ComponentPropsWithRef } from "react";
import type { NavigationListContractProps } from "#contracts/types/navigation-list-contract-props.type";

/**
 * Props of the web NavigationList: the shared contract plus the `nav`'s own props, passed through. The `nav`'s
 * `aria-label` is the contract's `label`, so the type refuses it.
 */
export type NavigationListProps = NavigationListContractProps &
  Omit<
    ComponentPropsWithRef<"nav">,
    keyof NavigationListContractProps | "children" | "aria-label"
  > & {
    /** True for the icon rail: labels leave the sight (they stay the accessible name) and a tooltip shows each. */
    readonly isCompact?: boolean | undefined;
  };
