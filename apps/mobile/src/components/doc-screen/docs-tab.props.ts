/**
 * Stackra file contract:
 * Purpose: `DocsTabProps`: props of `DocsTab`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ApiDoc, ComponentEntry } from "@stackra/showcase";

import type { ComponentDemos } from "#src/components/doc-screen/component-demos.type";

/** Props of {@link DocsTab}. */
export interface DocsTabProps {
  /** The registry entry. */
  readonly entry: ComponentEntry;
  /** The entry's generated native ApiDoc, for the styling slots. */
  readonly api: ApiDoc | undefined;
  /** The entry's native demos, for the RTL preview. */
  readonly demos: ComponentDemos | undefined;
  /** Called with a related entry to push. */
  readonly onPush: (entry: ComponentEntry) => void;
  /** Called with a sibling entry to show in place. */
  readonly onReplace: (entry: ComponentEntry) => void;
}
