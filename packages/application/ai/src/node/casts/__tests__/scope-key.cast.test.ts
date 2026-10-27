/**
 * Stackra file contract:
 * Purpose: unit tests of `ScopeKeyCast`: a sealed value opens for its own column and tenant, never for another
 *          tenant or column, holds no plain text, and an empty owner is refused.
 * Boundary: test only; the cipher is the real AES-GCM driver over the memory key provider with a fixed test key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 9); ADR 0188 (decision 2).
 */
import { AesGcmFieldCipherDriver, MemoryKeyProviderDriver } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ScopeKeyCast } from "#node/casts/scope-key.cast";

describe(ScopeKeyCast, () => {
  const cast = new ScopeKeyCast(
    new AesGcmFieldCipherDriver(
      new MemoryKeyProviderDriver([{ id: "k1", key: new Uint8Array(32).fill(7) }]),
    ),
  );
  const column = "ai.messages.content";

  it("opens only for the same column and tenant", async () => {
    const sealed = await cast.seal("privileged advice", { column, scopeId: "scp_a" });
    expect(sealed).not.toContain("privileged");
    await expect(cast.open(sealed, { column, scopeId: "scp_a" })).resolves.toBe(
      "privileged advice",
    );
    await expect(cast.open(sealed, { column, scopeId: "scp_b" })).rejects.toThrow();
    await expect(
      cast.open(sealed, { column: "ai.runs.actor", scopeId: "scp_a" }),
    ).rejects.toThrow();
  });

  it("refuses an empty owner", () => {
    expect(() => cast.seal("x", { column, scopeId: "" })).toThrow(TypeError);
  });
});
