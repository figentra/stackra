/**
 * Stackra file contract:
 * Purpose: unit tests of `whereEncrypted`: the filter on `<field>Bidx` equals the blind index the subscriber writes
 *          for the same value in the model's context, and a field that keeps no index is refused.
 * Boundary: test only; a stand-in entity manager that answers the model's metadata.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); gap gov9 (stackra-313).
 */
import type { EntityManager } from "@mikro-orm/core";
import { KeyProvider } from "@stackra/contracts";
import type { DataKey } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { blindIndexOf } from "#core/functions/blind-index-of.function";
import { whereEncrypted } from "#core/functions/where-encrypted.function";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";

class OneKey extends KeyProvider {
  override async current(): Promise<DataKey> {
    return { id: "k1", key: new Uint8Array(32).fill(7) };
  }

  override async byId(id: string): Promise<DataKey> {
    return { id, key: new Uint8Array(32).fill(7) };
  }
}

class Lead extends Model.with(HasEncryptedFields({ lookup: ["email"] }, "email", "phone")) {
  email: string | null = null;

  emailBidx: string | null = null;

  phone: string | null = null;
}

const em = {
  getMetadata: () => ({ schema: "crm", className: "Lead" }),
} as unknown as EntityManager;

describe(whereEncrypted, () => {
  it("filters on the blind index of the value in the model's context", async () => {
    const keys = new OneKey();
    expect(await whereEncrypted(em, keys, Lead, "email", "hala@example.com")).toEqual({
      emailBidx: await blindIndexOf(keys, "hala@example.com", "crm.lead.email"),
    });
  });

  it("refuses a field that keeps no blind index", async () => {
    await expect(whereEncrypted(em, new OneKey(), Lead, "phone", "1")).rejects.toThrow(
      /keeps no blind index/,
    );
  });
});
