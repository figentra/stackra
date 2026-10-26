/**
 * Stackra file contract:
 * Purpose: `ListProps`, the props of the web `List` in `list.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (decisions 1, 2, 4 and 5); ADR 0165 (HeroUI v3 on web); WCAG 2.2 SC 4.1.2 and 4.1.3.
 */
import type { ComponentPropsWithRef } from "react";
import type { ListContractProps } from "#contracts/types/list-contract-props.type";
import type { ListItemData } from "#contracts/types/list-item-data.type";

/**
 * Props of the web List: the shared contract plus the props of its root `div`, passed through unchanged. The root holds
 * the surface, the empty state and the loading spinner, so `aria-busy` is set from `isLoading`, never by the caller.
 */
export type ListProps<TItem extends ListItemData = ListItemData> = ListContractProps<TItem> &
  Omit<ComponentPropsWithRef<"div">, keyof ListContractProps | "children" | "aria-busy">;
