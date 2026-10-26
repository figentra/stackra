/**
 * Stackra file contract:
 * Purpose: `MorphTabsProps`, props of the native MorphTabs: HeroUI Native Pro's own root props, the imperative `ref`
 *          included.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { MorphTabs as HeroMorphTabs } from "heroui-native-pro/morph-tabs";
import type { ComponentPropsWithRef } from "react";

/** Props of the native MorphTabs: HeroUI Native Pro's own root props, the imperative `ref` included. */
export type MorphTabsProps = ComponentPropsWithRef<typeof HeroMorphTabs>;
