/**
 * Stackra file contract:
 * Purpose: `TableProps`, props of the native Table: HeroUI Native Pro's own root props, passed through unchanged.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-008.
 */
import type { Table as HeroTable } from "heroui-native-pro/table";
import type { ComponentPropsWithRef } from "react";

/** Props of the native Table: HeroUI Native Pro's own root props, passed through unchanged. */
export type TableProps = ComponentPropsWithRef<typeof HeroTable>;
