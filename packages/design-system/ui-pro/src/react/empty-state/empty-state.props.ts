/**
 * Stackra file contract:
 * Purpose: `EmptyStateProps`, props of the web EmptyState: HeroUI Pro's own root props plus the attributes of the
 *          `div` it draws.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { EmptyStateRootProps as HeroEmptyStateRootProps } from "@heroui-pro/react/empty-state";
import type { ComponentPropsWithRef } from "react";

/** Props of the web EmptyState: HeroUI Pro's own root props plus the attributes of the `div` it draws. */
export type EmptyStateProps = HeroEmptyStateRootProps &
  Omit<ComponentPropsWithRef<"div">, keyof HeroEmptyStateRootProps>;
