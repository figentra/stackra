/**
 * Stackra file contract:
 * Purpose: `BadgeProps`, the props of the web `Badge` in `badge.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0304; ADR 0060; owner decision 6 of STA-350 (thin wrappers).
 */
import type { BadgeRootProps as HeroBadgeRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";

/**
 * Props of the web Badge: the shared contract plus HeroUI v3's own badge props, passed through unchanged. HeroUI's
 * `color` is the contract's `tone`, its physical `placement` is replaced by the logical one, and `label` owns the
 * accessible name, so `aria-label` and `aria-hidden` are refused (a span with no role takes no name).
 */
export type BadgeProps = BadgeContractProps &
  Omit<
    HeroBadgeRootProps<"span"> &
      Omit<ComponentPropsWithRef<"span">, keyof HeroBadgeRootProps<"span">>,
    keyof BadgeContractProps | "color" | "aria-label" | "aria-hidden"
  >;
