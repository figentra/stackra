/**
 * Stackra file contract:
 * Purpose: `NumberValueProps`, props of the native NumberValue: HeroUI Native Pro's own root props, passed through
 *          unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0329 (motion layer); ADR 0310 (decision 3); ADR 0303 (decision
 *                     7); STA-416 FR-008.
 */
import type { NumberValue as HeroNumberValue } from "heroui-native-pro/number-value";
import type { ComponentPropsWithRef } from "react";

/** Props of the native NumberValue: HeroUI Native Pro's own root props, passed through unchanged. */
export type NumberValueProps = ComponentPropsWithRef<typeof HeroNumberValue>;
