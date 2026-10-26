/**
 * Stackra file contract:
 * Purpose: `SplitViewProps`, props of the native SplitView: HeroUI Native Pro's own root props, unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import type { SplitView as HeroSplitView } from "heroui-native-pro/split-view";
import type { ComponentPropsWithRef } from "react";

/** Props of the native SplitView: HeroUI Native Pro's own root props, unchanged. */
export type SplitViewProps = ComponentPropsWithRef<typeof HeroSplitView>;
