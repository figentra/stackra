/**
 * Stackra file contract:
 * Purpose: `SheetProps`, props of the web Sheet: HeroUI Pro's own root props, unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { SheetProps as HeroSheetProps } from "@heroui-pro/react/sheet";

/** Props of the web Sheet: HeroUI Pro's own root props, unchanged. */
export type SheetProps = HeroSheetProps;
