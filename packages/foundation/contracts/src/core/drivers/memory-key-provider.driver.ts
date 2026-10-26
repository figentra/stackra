/**
 * Stackra file contract:
 * Purpose: the memory driver of the `KeyProvider` port (driver name `memory`): data keys handed to it in process, the
 *          last one current, any by id, for tests, local dev and a single process whose keys come from its secret store.
 * Boundary: a plain subclass of the port (this package sits below @stackra/container). It copies every key so a caller
 *           cannot change one afterwards, refuses a key that is not 256 bits or whose id cannot travel in a sealed
 *           form, never lists keys and never logs one. The KMS driver that wraps per-tenant data keys ships with its
 *           infra package (ADR 0188 decision 2).
 * Runtime: isomorphic
 * Governing contract: ADR 0188 (decision 2: envelope keys); ADR 0173 (nobody reads a value); ADR 0266 (memory first).
 */
import { KeyProvider } from "#core/ports/key-provider.port";
import type { DataKey } from "#core/types/data-key.type";

/** A key id that fits between the dots of a sealed form. */
const KEY_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** AES-256: 32 bytes. */
const KEY_BYTES = 32;

/**
 * Holds data keys in process memory.
 *
 * @example
 * const keys = new MemoryKeyProviderDriver([{ id: "k1", key: crypto.getRandomValues(new Uint8Array(32)) }]);
 */
export class MemoryKeyProviderDriver extends KeyProvider {
  private readonly keys = new Map<string, DataKey>();

  private readonly currentId: string;

  /**
   * @param keys - the keys, oldest first; the last is current.
   * @throws RangeError when there is no key, a key is not 32 bytes, an id is malformed or repeated.
   */
  constructor(keys: readonly DataKey[]) {
    super();
    for (const { id, key } of keys) {
      if (!KEY_ID.test(id)) throw new RangeError(`A key id is 1 to 64 of [A-Za-z0-9_-], got ${id}`);
      if (key.length !== KEY_BYTES)
        throw new RangeError(`Key ${id} must be ${KEY_BYTES} bytes, got ${key.length}`);
      if (this.keys.has(id)) throw new RangeError(`Key ${id} is given twice`);
      this.keys.set(id, Object.freeze({ id, key: new Uint8Array(key) }));
    }
    const current = keys.at(-1);
    if (current === undefined) throw new RangeError("MemoryKeyProviderDriver needs a key");
    this.currentId = current.id;
  }

  /** The key new data is sealed with. */
  current(): Promise<DataKey> {
    return this.byId(this.currentId);
  }

  /** The key with this id, for opening data sealed before a rotation. */
  byId(id: string): Promise<DataKey> {
    const key = this.keys.get(id);
    return key === undefined
      ? Promise.reject(new RangeError(`No data key has the id ${id}`))
      : Promise.resolve(key);
  }
}
