/**
 * Stackra file contract:
 * Purpose: `registerStores`, which links each store class to its derived key (`[UiStore, "console.ui"]`): the call the
 *          generated wiring makes for every store of a member, from the keys locked in `stackra.manifest.json`.
 * Boundary: writes `STORE_KEYS`; registering a class again replaces its key. A key is `<member>.<name>` in snake_case
 *           segments; anything else throws, so a hand-written key cannot drift from the derived form.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20 and 22); registry v3.1 gen-core needs (item 4, the wiring).
 */
import type { Store } from "#core/bases/store.base";
import { STORE_KEYS } from "#core/constants/store-keys.constant";
import type { StoreClass } from "#core/types/store-class.type";

/** `<member>.<name>`, each segment snake_case. */
const STORE_KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

/**
 * Registers the key of each store class.
 *
 * @throws RangeError when a key is not `<member>.<name>` in snake_case.
 * @example
 * registerStores([
 *   [UiStore, "console.ui"],
 *   [PaletteStore, "console.palette"],
 * ]);
 */
export function registerStores(
  entries: readonly (readonly [type: StoreClass<Store>, key: string])[],
): void {
  for (const [type, key] of entries) {
    if (!STORE_KEY.test(key))
      throw new RangeError(`Store key "${key}" is not <member>.<name> in snake_case`);
    STORE_KEYS.set(type, key);
  }
}
