/**
 * Stackra file contract:
 * Purpose: `BadgeProps`, props of the native Badge: the shared contract plus HeroUI Native Pro's own props, passed
 *          through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { Badge as HeroBadge } from "heroui-native-pro/badge";
import type { ComponentPropsWithRef } from "react";

import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";

/**
 * Props of the native Badge: the shared contract plus HeroUI Native Pro's own props, passed through unchanged. The
 * colour role is `tone`, so HeroUI's `color` is left out of the type.
 */
export type BadgeProps = BadgeContractProps &
  Omit<ComponentPropsWithRef<typeof HeroBadge>, keyof BadgeContractProps | "color">;
