/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantTokenService` and `MemoryTenantTokensDriver`: an issued token resolves to its tenant
 *          for its purpose only, is stored by hash and never in clear, refuses a bad tenant or an empty purpose, and
 *          stops resolving once revoked; a malformed or unknown token resolves to `undefined`.
 * Boundary: test only; the memory driver stands in for the OS tenancy store.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0239; OS scheduling-calendar SPEC gap 2.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MemoryTenantTokensDriver } from "#core/drivers/memory-tenant-tokens.driver";
import { TenantTokens } from "#core/ports/tenant-tokens.port";
import { TenantTokenService } from "#core/services/tenant-token.service";

const ACME = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";

/** A service over a fresh memory store, and the store. */
function setup() {
  const store = new MemoryTenantTokensDriver();
  return { store, tokens: new TenantTokenService(store) };
}

describe(TenantTokenService, () => {
  it("issues a token that resolves to its tenant for its purpose only", async () => {
    const { store, tokens } = setup();
    expect(store).toBeInstanceOf(TenantTokens);
    const token = await tokens.issue(ACME, "calendar.feed");
    expect(token).toMatch(/^ttk_[0-9a-f]{64}$/);
    await expect(tokens.resolve(token, "calendar.feed")).resolves.toBe(ACME);
    await expect(tokens.resolve(token, "documents.link")).resolves.toBeUndefined();
  });

  it("stores the hash, never the token", async () => {
    const { store, tokens } = setup();
    const token = await tokens.issue(ACME, "calendar.feed");
    await expect(store.find(token)).resolves.toBeUndefined();
  });

  it("issues a different token each time", async () => {
    const { tokens } = setup();
    expect(await tokens.issue(ACME, "calendar.feed")).not.toBe(
      await tokens.issue(ACME, "calendar.feed"),
    );
  });

  it("refuses a value that is not a tenant id and an empty purpose", async () => {
    const { tokens } = setup();
    await expect(tokens.issue("usr_x" as PublicId<"scp">, "calendar.feed")).rejects.toThrow(
      TypeError,
    );
    await expect(tokens.issue(ACME, "")).rejects.toThrow(RangeError);
  });

  it("resolves nothing for a malformed or unknown token", async () => {
    const { tokens } = setup();
    await expect(tokens.resolve("nope", "calendar.feed")).resolves.toBeUndefined();
    await expect(tokens.resolve(`ttk_${"0".repeat(64)}`, "calendar.feed")).resolves.toBeUndefined();
  });

  it("stops resolving a revoked token", async () => {
    const { tokens } = setup();
    const token = await tokens.issue(ACME, "calendar.feed");
    await tokens.revoke(token);
    await tokens.revoke("nope");
    await expect(tokens.resolve(token, "calendar.feed")).resolves.toBeUndefined();
  });
});
