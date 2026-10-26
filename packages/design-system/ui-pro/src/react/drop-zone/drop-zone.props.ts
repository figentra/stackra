/**
 * Stackra file contract:
 * Purpose: `DropZoneProps`, props of the web DropZone root: HeroUI Pro's own, which has no prop the Stackra vocabulary
 *          renames.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { DropZoneProps as HeroDropZoneProps } from "@heroui-pro/react/drop-zone";

/** Props of the web DropZone root: HeroUI Pro's own, which has no prop the Stackra vocabulary renames. */
export type DropZoneProps<E extends keyof React.JSX.IntrinsicElements = "div"> =
  HeroDropZoneProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof HeroDropZoneProps<E>>;
