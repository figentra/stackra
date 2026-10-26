/**
 * Stackra file contract:
 * Purpose: `WidgetProps`, props of the native Widget: HeroUI Native Pro's own root props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { Widget as HeroWidget } from "heroui-native-pro/widget";
import type { ComponentPropsWithRef } from "react";

/** Props of the native Widget: HeroUI Native Pro's own root props, passed through unchanged. */
export type WidgetProps = ComponentPropsWithRef<typeof HeroWidget>;
