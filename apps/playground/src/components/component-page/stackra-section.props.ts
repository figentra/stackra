/**
 * Stackra file contract:
 * Purpose: `StackraSectionProps`, props of the Stackra section: the entry, the platform and the ApiDoc (for the
 *          replaced props).
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); showcase redesign spec (2026-10-27) section 4 (row 10).
 */
import type { ApiDoc } from "@stackra/showcase";

import type { SectionProps } from "#src/components/component-page/section.props";

/** Props of `StackraSection`. */
export interface StackraSectionProps extends SectionProps {
  /** The entry's API doc, for the props Stackra replaces. */
  readonly apiDoc?: ApiDoc | undefined;
}
