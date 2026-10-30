/**
 * Stackra file contract:
 * Purpose: `OverflowListProps`, the props of the web `OverflowList` in `overflow-list.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory (2026-10-28) row 24.
 */
import type { ComponentPropsWithRef } from "react";
import type { OverflowListContractProps } from "#contracts/types/overflow-list-contract-props.type";

/**
 * Props of the web OverflowList: the shared contract plus the props of a `div`, passed through to the root. The list
 * draws its own chips, so children are refused, and `label` owns the accessible name.
 */
export type OverflowListProps = OverflowListContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof OverflowListContractProps | "children" | "aria-label">;
