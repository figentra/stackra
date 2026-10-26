/**
 * Stackra file contract:
 * Purpose: `EmptyStateProps`, props of the native EmptyState: HeroUI Native Pro's own root props, passed through
 *          unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { EmptyState as HeroEmptyState } from "heroui-native-pro/empty-state";
import type { ComponentPropsWithRef } from "react";

/** Props of the native EmptyState: HeroUI Native Pro's own root props, passed through unchanged. */
export type EmptyStateProps = ComponentPropsWithRef<typeof HeroEmptyState>;
