/**
 * Stackra file contract:
 * Purpose: unit tests of `TillCredentials`: an abstract port a host implements; `get` and `save` one credential per
 *          unit.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9); ADR 0364.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { TillCredential } from "#contracts/types/till-credential.type";

/** A host store in a Map. */
class MapStore extends TillCredentials {
  readonly map = new Map<string, TillCredential>();

  async get(unitId: string): Promise<TillCredential | null> {
    return this.map.get(unitId) ?? null;
  }

  async save(credential: TillCredential): Promise<void> {
    this.map.set(credential.unitId, credential);
  }
}

describe("TillCredentials", () => {
  it("is a port that keeps one credential per unit", async () => {
    const store = new MapStore();
    const credential: TillCredential = {
      unitId: "u",
      stage: "production",
      requestId: null,
      token: null,
      secret: null,
      certificate: null,
      certificateSerial: "1",
    };
    expect(store).toBeInstanceOf(Port);
    await store.save(credential);
    expect(await store.get("u")).toBe(credential);
  });
});
