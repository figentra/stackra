/**
 * Stackra file contract:
 * Purpose: `MorphTabsProps`, the props of the web `MorphTabs` in `morph-tabs.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3).
 */
import type { ComponentPropsWithoutRef } from "react";
import type { MorphTabsContractProps } from "#contracts/types/morph-tabs-contract-props.type";

/** Props of the web MorphTabs: the shared contract plus the root's own props, passed through. */
export type MorphTabsProps = MorphTabsContractProps &
  Omit<ComponentPropsWithoutRef<"div">, keyof MorphTabsContractProps | "children">;
