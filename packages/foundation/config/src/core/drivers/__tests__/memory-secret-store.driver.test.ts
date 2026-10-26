/**
 * Stackra file contract:
 * Purpose: unit tests of `MemorySecretStoreDriver`: it is the `SecretStore` port, answers only the secrets set (the
 *          last call for a name winning), and lists nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";

import { SecretStore } from "#contracts/ports/secret-store.port";
import { MemorySecretStoreDriver } from "#core/drivers/memory-secret-store.driver";

describe(MemorySecretStoreDriver, () => {
  it("answers the secrets set and nothing else", () => {
    const store = new MemorySecretStoreDriver();
    expect(store).toBeInstanceOf(SecretStore);
    expect(store.get("RESEND_API_KEY")).toBeUndefined();
    store.set("RESEND_API_KEY", "re_old").set("RESEND_API_KEY", "re_test");
    expect(store.get("RESEND_API_KEY")).toBe("re_test");
    expect(Object.keys(store)).not.toContain("RESEND_API_KEY");
    expect(JSON.stringify(store)).not.toContain("re_test");
  });
});
