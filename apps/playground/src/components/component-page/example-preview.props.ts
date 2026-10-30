/**
 * Stackra file contract:
 * Purpose: `ExamplePreviewProps`, props of one example block: the entry, the example, its words and its heading level.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4.
 */
import type { ComponentEntry, ExampleEntry } from "@stackra/showcase";

/** Props of `ExamplePreview`. */
export interface ExamplePreviewProps {
  /** The anchor id of the block. */
  readonly id: string;
  /** The registry entry the example belongs to. */
  readonly entry: ComponentEntry;
  /** The example to draw. */
  readonly example: ExampleEntry;
  /** The translated title. */
  readonly title: string;
  /** The translated note under the title, when the catalogue has one. */
  readonly note?: string | undefined;
  /** The heading level: 3 under Import (Usage) and under Examples. */
  readonly level?: 2 | 3 | undefined;
}
