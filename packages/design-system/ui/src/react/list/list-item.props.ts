/**
 * Stackra file contract:
 * Purpose: `ListItemProps`, the props of the web `ListItem` in `list-item.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (text slots); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 2.5.8 (target size).
 */
import type { ComponentPropsWithRef } from "react";
import type { ListItemContractProps } from "#contracts/types/list-item-contract-props.type";

/** Props of the web ListItem: the shared contract plus the props of its `li`, passed through unchanged. */
export type ListItemProps = ListItemContractProps &
  Omit<ComponentPropsWithRef<"li">, keyof ListItemContractProps | "children">;
