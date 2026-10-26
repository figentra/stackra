/**
 * Stackra file contract:
 * Purpose: `TagGroupProps`, the props of the web `TagGroup` in `tag-group.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0055 (one field contract); owner decision 6 of STA-350 (thin wrappers).
 */
import type { TagGroupRootProps } from "@heroui/react";
import type { TagGroupContractProps } from "#contracts/types/tag-group-contract-props.type";

/**
 * Props of the web TagGroup: the shared contract plus HeroUI v3's own tag group props, passed through unchanged.
 * The app lists tags as `items`, and the selection is the contract's `value`, never HeroUI's selected keys.
 */
export type TagGroupProps = TagGroupContractProps &
  Omit<
    TagGroupRootProps,
    | keyof TagGroupContractProps
    | "children"
    | "selectedKeys"
    | "defaultSelectedKeys"
    | "onSelectionChange"
    | "disabledKeys"
  >;
