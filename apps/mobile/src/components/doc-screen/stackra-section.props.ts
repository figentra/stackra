/**
 * Stackra file contract:
 * Purpose: `StackraSectionProps`: props of `StackraSection`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentEntry } from "@stackra/showcase";

import type { ComponentDemos } from "#src/components/doc-screen/component-demos.type";

/** Props of {@link StackraSection}. */
export interface StackraSectionProps {
  /** The registry entry. */
  readonly entry: ComponentEntry;
  /** The entry's native demos; the usage example is the one flipped in the RTL preview. */
  readonly demos: ComponentDemos | undefined;
}
