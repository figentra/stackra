/**
 * Stackra file contract:
 * Purpose: unit tests of the `KeyProvider` port: a `Port` that hands out the current data key and an earlier one by
 *          id, refusing an unknown id.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Port } from "#core/bases/port.base";
import { KeyProvider } from "#core/ports/key-provider.port";
import type { DataKey } from "#core/types/data-key.type";

class TwoKeys extends KeyProvider {
  private readonly keys: readonly DataKey[] = [
    { id: "k1", key: new Uint8Array([1]) },
    { id: "k2", key: new Uint8Array([2]) },
  ];

  override async current(): Promise<DataKey> {
    return this.keys[1] as DataKey;
  }

  override async byId(id: string): Promise<DataKey> {
    const found = this.keys.find((key) => key.id === id);
    if (found === undefined) throw new Error(`No key ${id}`);
    return found;
  }
}

describe("KeyProvider", () => {
  it("is a port an implementation extends", () => {
    expect(new TwoKeys()).toBeInstanceOf(KeyProvider);
    expect(Object.getPrototypeOf(KeyProvider)).toBe(Port);
  });

  it("hands out the current key and an earlier one by id", async () => {
    const provider: KeyProvider = new TwoKeys();
    expect((await provider.current()).id).toBe("k2");
    expect((await provider.byId("k1")).key).toEqual(new Uint8Array([1]));
    await expect(provider.byId("gone")).rejects.toThrow("No key gone");
  });
});
