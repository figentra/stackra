/**
 * Stackra file contract:
 * Purpose: `FilterBarProps`, the props of the web `FilterBar` in `filter-bar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decisions 1 to 4); ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers);
 *          WCAG 2.2 SC 1.3.1, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3.
 */
import type { ComponentPropsWithRef } from "react";
import type { FilterBarContractProps } from "#contracts/types/filter-bar-contract-props.type";

/**
 * Props of the web FilterBar: the shared contract plus the props of a `div`, passed through to the root. The bar draws
 * its own content, so children are refused.
 */
export type FilterBarProps = FilterBarContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof FilterBarContractProps | "children">;
