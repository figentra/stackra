/**
 * Stackra file contract:
 * Purpose: `usePrefs()`, the hook a component or a route's own hook reads and writes the `prefs` area with: per-device
 *          choices such as `prefs.write(DevicePrefs, values)` that never reach the server.
 * Boundary: resolves the `Storage` port from the nearest container (`useContainer` throws outside a
 *           `ContainerProvider`, an unbound port throws `UnresolvedPortError`), so a missing driver is a boot or test
 *           failure. It does not re-render on a write; a value the screen shows lives in a store or the hook's state.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 2: the prefs store), ADR 0294 (decision 17), ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";

import { Storage } from "#contracts/ports/storage.port";
import type { StorageAreaHandle } from "#contracts/types/storage-area-handle.type";

/**
 * The `prefs` area of the container's `Storage`.
 *
 * @example
 * const prefs = usePrefs();
 * const save = (values: DevicePrefs) => prefs.write(DevicePrefs, values);
 */
export function usePrefs(): StorageAreaHandle {
  return useContainer().get(Storage).prefs;
}
