/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryKeyProviderDriver`: it is the `KeyProvider` port; the last key is current; any key is
 *          found by id; an unknown id rejects; the keys are copies; a missing, short, repeated or badly named key is
 *          refused.
 * Boundary: test only; the keys are random test bytes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0188 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryKeyProviderDriver } from "#core/drivers/memory-key-provider.driver";
import { KeyProvider } from "#core/ports/key-provider.port";

const bytes = (fill: number) => new Uint8Array(32).fill(fill);

describe("MemoryKeyProviderDriver", () => {
  it("hands out the last key as current and any key by id", async () => {
    const source = bytes(1);
    const keys = new MemoryKeyProviderDriver([
      { id: "k1", key: source },
      { id: "k2", key: bytes(2) },
    ]);
    expect(keys).toBeInstanceOf(KeyProvider);
    expect((await keys.current()).id).toBe("k2");
    source.fill(9);
    expect((await keys.byId("k1")).key).toEqual(bytes(1));
    await expect(keys.byId("k3")).rejects.toThrow(RangeError);
  });

  it("refuses bad keys", () => {
    expect(() => new MemoryKeyProviderDriver([])).toThrow(RangeError);
    expect(() => new MemoryKeyProviderDriver([{ id: "k1", key: new Uint8Array(16) }])).toThrow(
      RangeError,
    );
    expect(() => new MemoryKeyProviderDriver([{ id: "k.1", key: bytes(1) }])).toThrow(RangeError);
    expect(
      () =>
        new MemoryKeyProviderDriver([
          { id: "k1", key: bytes(1) },
          { id: "k1", key: bytes(2) },
        ]),
    ).toThrow(RangeError);
  });
});
