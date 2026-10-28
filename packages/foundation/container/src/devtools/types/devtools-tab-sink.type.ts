/**
 * Stackra file contract:
 * Purpose: `DevtoolsTabSink`, the one method of `DevtoolsKit` a package's devtools entry needs: `defineTab`. Typed by
 *          shape so `@stackra/devtools-kit` (which depends on container and events) satisfies it without container,
 *          events, actions or query depending on the kit, which would close a package cycle.
 * Boundary: a type only. It mirrors `DevtoolsKit.defineTab` and `DevtoolsRemover` of @stackra/devtools-kit; a change
 *           there is a change here.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 4: each package's devtools entry plugs its own panels in); ADR 0461 (the
 *                     data is free, the panel UI is Pro).
 */
import type { DevtoolsTabSinkDefinition } from "#devtools/types/devtools-tab-sink-definition.type";

/** The kit, as a devtools entry sees it: `DevtoolsKit` from @stackra/devtools-kit fits. */
export interface DevtoolsTabSink {
  /** Defines a tab and returns what removes it. */
  defineTab: (definition: DevtoolsTabSinkDefinition) => () => void;
}
