/**
 * Stackra file contract:
 * Purpose: `MemoryStoreStorage`, the in-memory client storage `createStore` and `mountStore` use when a test passes
 *          none: named areas of synchronous key-value maps, so hydration completes before the helper returns.
 * Boundary: test support, internal to `./testing`. Values are copied through JSON on the way in and out, as a real
 *           driver serialises them, so a test sees exactly what would survive a reload and cannot mutate stored state
 *           through a reference.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0294 (decision 15 note: `<name>.fake.ts`); ADR 0256.
 */
import type { StoreStorage, StoreStorageArea } from "#core/index";

/** Client storage held in memory, one map per area. */
export class MemoryStoreStorage implements StoreStorage {
  /** Area name to its area. */
  readonly #areas = new Map<string, StoreStorageArea>();

  /** The area named `name`, created empty on first use; the same object every time. */
  area(name: string): StoreStorageArea {
    const known = this.#areas.get(name);
    if (known !== undefined) return known;
    const values = new Map<string, string>();
    const area: StoreStorageArea = {
      get: (key) => {
        const stored = values.get(key);
        return stored === undefined ? undefined : (JSON.parse(stored) as unknown);
      },
      set: (key, value) => {
        values.set(key, JSON.stringify(value));
      },
    };
    this.#areas.set(name, area);
    return area;
  }
}
