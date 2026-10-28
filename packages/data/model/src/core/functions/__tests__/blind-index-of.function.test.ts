/**
 * Stackra file contract:
 * Purpose: unit tests of `blindIndexOf`: equal values in one context give equal indexes named by the current key id;
 *          another value, another context or another key gives another index; the index holds no plain text.
 * Boundary: test only; an in-test key provider whose current key a test can rotate.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); gap gov9 (stackra-313).
 */
import { KeyProvider } from "@stackra/contracts";
import type { DataKey } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { blindIndexOf } from "#core/functions/blind-index-of.function";

/** Two fixed keys; `id` picks the current one. */
class TwoKeys extends KeyProvider {
  id = "k1";

  override async current(): Promise<DataKey> {
    return this.byId(this.id);
  }

  override async byId(id: string): Promise<DataKey> {
    return { id, key: new Uint8Array(32).fill(id === "k1" ? 1 : 2) };
  }
}

describe(blindIndexOf, () => {
  it("gives equal values in one context the same index, named by the key", async () => {
    const keys = new TwoKeys();
    const index = await blindIndexOf(keys, "hala@example.com", "crm.lead.email");
    expect(index).toMatch(/^k1\.[0-9a-f]{64}$/);
    expect(await blindIndexOf(keys, "hala@example.com", "crm.lead.email")).toBe(index);
    expect(index).not.toContain("hala");
  });

  it("differs by value, context and key", async () => {
    const keys = new TwoKeys();
    const index = await blindIndexOf(keys, "hala@example.com", "crm.lead.email");
    expect(await blindIndexOf(keys, "omar@example.com", "crm.lead.email")).not.toBe(index);
    expect(await blindIndexOf(keys, "hala@example.com", "crm.contact.email")).not.toBe(index);
    keys.id = "k2";
    const rotated = await blindIndexOf(keys, "hala@example.com", "crm.lead.email");
    expect(rotated.startsWith("k2.")).toBe(true);
    expect(rotated.slice(3)).not.toBe(index.slice(3));
  });
});
