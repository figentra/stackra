/**
 * Stackra file contract:
 * Purpose: `TagGroupProps`, the props of the native `TagGroup` in `tag-group.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import type { TagGroup as HeroTagGroup } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { TagGroupContractProps } from "#contracts/types/tag-group-contract-props.type";

/**
 * Props of the native TagGroup: the shared contract plus HeroUI Native's own tag group props, passed through
 * unchanged. The app lists tags as `items`, and the selection is the contract's `value`, never HeroUI's selected keys.
 */
export type TagGroupProps = TagGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroTagGroup>,
    | keyof TagGroupContractProps
    | "children"
    | "selectedKeys"
    | "defaultSelectedKeys"
    | "onSelectionChange"
    | "disabledKeys"
  >;
