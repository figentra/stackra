/**
 * Stackra file contract:
 * Purpose: `PreviewPagerProps`: props of `PreviewPager`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentEntry } from "@stackra/showcase";

import type { ComponentDemos } from "#src/components/doc-screen/component-demos.type";

/** Props of {@link PreviewPager}. */
export interface PreviewPagerProps {
  /** The registry entry. */
  readonly entry: ComponentEntry;
  /** The entry's native demos. */
  readonly demos: ComponentDemos | undefined;
  /** Called with the example id when "View code" is pressed. */
  readonly onViewCode: (id: string) => void;
}
