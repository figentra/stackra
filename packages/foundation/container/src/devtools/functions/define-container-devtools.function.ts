/**
 * Stackra file contract:
 * Purpose: `defineContainerDevtools`, the devtools entry of @stackra/container: it defines the `container.bindings`
 *          tab, read from `Container.bindings()` (token, scope, lifetime, implementation) each time a host opens it.
 * Boundary: data only, no UI and no Pro import; the Pro panel (@stackra-pro/devtools) finds the tab through the kit's
 *           host session. It never reads instances. Development only (ADR 0246 decision 1): only the dev bootstrap
 *           imports `./devtools`.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 1, 2 and 4); ADR 0461.
 */
import type { Container } from "#core/services/container.service";
import type { DevtoolsTabSink } from "#devtools/types/devtools-tab-sink.type";

/**
 * Defines the container's devtools tab.
 *
 * @param kit - the devtools kit (`DevtoolsKit`), or anything with its `defineTab`.
 * @param container - the root container of the app or service.
 * @returns removes the tab.
 * @example
 * defineContainerDevtools(container.get(DevtoolsKit), container);
 */
export function defineContainerDevtools(kit: DevtoolsTabSink, container: Container): () => void {
  return kit.defineTab({
    id: "container.bindings",
    title: "Container bindings",
    category: "container",
    read: () => container.bindings(),
  });
}
