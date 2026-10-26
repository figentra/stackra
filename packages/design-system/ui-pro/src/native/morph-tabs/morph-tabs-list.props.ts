/**
 * Stackra file contract:
 * Purpose: `MorphTabsListProps`, props of `MorphTabs.List`: the shared contract plus HeroUI Native Pro's own, with
 *          `accessibilityLabel` renamed `label`.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { MorphTabs as HeroMorphTabs } from "heroui-native-pro/morph-tabs";
import type { ComponentPropsWithRef } from "react";

import type { MorphTabsListContractProps } from "#contracts/types/morph-tabs-contract-props.type";

/**
 * Props of `MorphTabs.List`: the shared contract plus HeroUI Native Pro's own, with `accessibilityLabel` renamed
 * `label`.
 */
export type MorphTabsListProps = MorphTabsListContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroMorphTabs.List>,
    keyof MorphTabsListContractProps | "accessibilityLabel" | "aria-label"
  >;
