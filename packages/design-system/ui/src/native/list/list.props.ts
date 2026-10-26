/**
 * Stackra file contract:
 * Purpose: `ListProps`, the props of the native `List` in `list.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (decisions 1, 2, 4, 5 and 7); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 4.1.2 and 4.1.3.
 */
import type { ViewProps } from "react-native";
import type { ListContractProps } from "#contracts/types/list-contract-props.type";
import type { ListItemData } from "#contracts/types/list-item-data.type";

/** Props of the native List: the shared contract plus the props of its root `View`, passed through unchanged. */
export type ListProps<TItem extends ListItemData = ListItemData> = ListContractProps<TItem> &
  Omit<ViewProps, keyof ListContractProps | "children" | "accessibilityLabel">;
