/**
 * Stackra file contract:
 * Purpose: `FilterPanelProps`, the props of the web `FilterPanel` in `filter-panel.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0318;
 *          design-system gap inventory (2026-10-28) row 9.
 */
import type { ComponentPropsWithRef } from "react";
import type { FilterPanelContractProps } from "#contracts/types/filter-panel-contract-props.type";

/**
 * Props of the web FilterPanel: the shared contract plus the props of a `section`, passed through to the root. The
 * panel draws its own content, so children are refused, and `label` owns the accessible name.
 */
export type FilterPanelProps = FilterPanelContractProps &
  Omit<
    ComponentPropsWithRef<"section">,
    keyof FilterPanelContractProps | "children" | "aria-label"
  >;
