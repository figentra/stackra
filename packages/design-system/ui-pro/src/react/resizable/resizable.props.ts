/**
 * Stackra file contract:
 * Purpose: `ResizableProps`, props of the web Resizable: HeroUI Pro's own root props, unchanged.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ResizableProps as HeroResizableProps } from "@heroui-pro/react/resizable";

/** Props of the web Resizable: HeroUI Pro's own root props, unchanged. */
export type ResizableProps = HeroResizableProps;
