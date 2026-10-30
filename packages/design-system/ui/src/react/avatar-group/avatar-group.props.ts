/**
 * Stackra file contract:
 * Purpose: `AvatarGroupProps`, the props of the web `AvatarGroup` in `avatar-group.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 25.
 */
import type { AvatarGroup as HeroAvatarGroup } from "@heroui/react";
import type { ComponentProps } from "react";
import type { AvatarGroupContractProps } from "#contracts/types/avatar-group-contract-props.type";

/**
 * Props of the web AvatarGroup: the shared contract plus HeroUI v3's own avatar group root props, passed through.
 * The wrapper builds the children and the count, and `label` names the group, so `children`, `color`, `isGrid`,
 * `role` and `aria-label` are refused.
 */
export type AvatarGroupProps = AvatarGroupContractProps &
  Omit<
    ComponentProps<typeof HeroAvatarGroup>,
    keyof AvatarGroupContractProps | "children" | "color" | "isGrid" | "role" | "aria-label"
  >;
