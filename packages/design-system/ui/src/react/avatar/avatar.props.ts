/**
 * Stackra file contract:
 * Purpose: `AvatarProps`, the props of the web `Avatar` in `avatar.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0303 (decision 7); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { AvatarRootProps } from "@heroui/react";
import type { AvatarContractProps } from "#contracts/types/avatar-contract-props.type";

/**
 * Props of the web Avatar: the shared contract plus HeroUI v3's own avatar root props, passed through unchanged.
 * HeroUI's `color` is the contract's `tone`, the wrapper builds the children, and `label` owns the accessible name,
 * so `role`, `aria-label` and `aria-hidden` are refused.
 */
export type AvatarProps = AvatarContractProps &
  Omit<
    AvatarRootProps,
    keyof AvatarContractProps | "color" | "children" | "role" | "aria-label" | "aria-hidden"
  >;
