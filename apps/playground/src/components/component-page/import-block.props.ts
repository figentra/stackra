/**
 * Stackra file contract:
 * Purpose: `ImportBlockProps`, props of the import block: the entry, the platform shown and the platform switch.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4.
 */
import type { Platform } from "@stackra/showcase";

import type { SectionProps } from "#src/components/component-page/section.props";

/** Props of `ImportBlock`. */
export interface ImportBlockProps extends SectionProps {
  /** Called with the platform the reader picks; the control shows only when the entry has both. */
  readonly onPlatformChange: (platform: Platform) => void;
}
