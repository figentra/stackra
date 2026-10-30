/**
 * Stackra file contract:
 * Purpose: `UsageTabProps`: props of `UsageTab`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ComponentEntry } from "@stackra/showcase";

import type { ComponentDemos } from "#src/components/doc-screen/component-demos.type";

/** Props of {@link UsageTab}. */
export interface UsageTabProps {
  /** The registry entry. */
  readonly entry: ComponentEntry;
  /** The entry's native demos and sources. */
  readonly demos: ComponentDemos | undefined;
  /** The example to scroll to with its code open (the `example` route param), if any. */
  readonly example?: string | undefined;
}
