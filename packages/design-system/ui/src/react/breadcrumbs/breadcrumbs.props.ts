/**
 * Stackra file contract:
 * Purpose: `BreadcrumbsProps`, the props of the web `Breadcrumbs` in `breadcrumbs.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313; ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.4.8.
 */
import type { BreadcrumbsRootProps } from "@heroui/react";
import type { BreadcrumbsContractProps } from "#contracts/types/breadcrumbs-contract-props.type";

/**
 * Props of the web Breadcrumbs: the shared contract plus HeroUI v3's own breadcrumbs props, passed through unchanged.
 * The app lists the trail as `items`, so the type refuses JSX children, and HeroUI's `aria-label` is the contract's
 * `label`.
 */
export type BreadcrumbsProps = BreadcrumbsContractProps &
  Omit<
    BreadcrumbsRootProps,
    keyof BreadcrumbsContractProps | "children" | "aria-label" | "className"
  > & {
    /** Extra classes for the list; a string only, because HeroUI merges it into its own slot class. */
    readonly className?: string | undefined;
  };
