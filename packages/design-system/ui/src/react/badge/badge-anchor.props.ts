/**
 * Stackra file contract:
 * Purpose: `BadgeAnchorProps`: props of the web Badge.Anchor.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI v3
 *          on web); ADR 0304; ADR 0060; owner decision 6 of STA-350 (thin wrappers).
 */
import type { BadgeAnchorProps as HeroBadgeAnchorProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";
import type { BadgeAnchorContractProps } from "#contracts/types/badge-anchor-contract-props.type";

/** Props of the web Badge.Anchor: the shared contract plus HeroUI v3's anchor props, passed through unchanged. */
export type BadgeAnchorProps = BadgeAnchorContractProps &
  Omit<
    HeroBadgeAnchorProps<"span"> &
      Omit<ComponentPropsWithRef<"span">, keyof HeroBadgeAnchorProps<"span">>,
    "children"
  >;
