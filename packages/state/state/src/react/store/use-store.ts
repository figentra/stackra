/**
 * Stackra file contract:
 * Purpose: `useStore(Class)`, the hook a component reads a store with: the instance the container of the nearest
 *          `ContainerProvider` binds, with a re-render after every change of it (a `set` or a hydration).
 * Boundary: resolves by class from the container and builds nothing; throws outside a provider or for a class the
 *           container does not bind. Subscribes through `useSyncExternalStore` on the store's version, so concurrent
 *           renders never tear. Returns the store itself: read its fields and getters, call its methods.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2); ADR 0294 (decisions 16 and 17).
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useCallback, useSyncExternalStore } from "react";

import type { Store } from "#core/bases/store.base";
import { storeVersion } from "#core/functions/store-version.function";
import { subscribeStore } from "#core/functions/subscribe-store.function";

/**
 * The bound instance of a store class.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `type`.
 * @example
 * const palette = useStore(PaletteStore);
 * palette.isOpen; // re-renders when the palette opens or closes
 */
export function useStore<S extends Store>(type: AnyClass<S>): S {
  const store = useContainer().get(type);
  const subscribe = useCallback((onChange: () => void) => subscribeStore(store, onChange), [store]);
  const version = useCallback(() => storeVersion(store), [store]);
  useSyncExternalStore(subscribe, version, version);
  return store;
}
