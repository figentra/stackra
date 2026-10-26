/**
 * Stackra file contract:
 * Purpose: unit tests of `PackStore`: an abstract port a driver implements with `get`, `put` and `hashes`.
 * Boundary: test only; a minimal map-backed store stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0385.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PackStore } from "#core/ports/pack-store.port";
import type { SignedPack } from "#core/types/signed-pack.type";

/** A store over a map. */
class MapStore extends PackStore {
  readonly stored = new Map<string, SignedPack>();

  async get(hash: string): Promise<unknown> {
    return this.stored.get(hash) ?? null;
  }

  async put(signed: SignedPack): Promise<void> {
    this.stored.set(signed.hash, signed);
  }

  async hashes(): Promise<readonly string[]> {
    return [...this.stored.keys()].sort();
  }
}

describe("PackStore", () => {
  it("is a port with get, put and hashes", async () => {
    const store = new MapStore();
    expect(store).toBeInstanceOf(Port);
    expect(await store.get("0".repeat(64))).toBeNull();
    expect(await store.hashes()).toEqual([]);
  });
});
