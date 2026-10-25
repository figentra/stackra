/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectedAccount`: `create` builds a frozen account, the label defaults to the id, and an
 *          empty id is a programming error.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 14); ADR 0328 (decisions 1 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ConnectedAccount } from "#core/values/connected-account.value";

describe("ConnectedAccount", () => {
  it("is built with create and frozen", () => {
    const account = ConnectedAccount.create({ id: "shop.acme.example", label: "Acme shop" });
    expect(account).toBeInstanceOf(ConnectedAccount);
    expect(account).toMatchObject({ id: "shop.acme.example", label: "Acme shop" });
    expect(Object.isFrozen(account)).toBe(true);
  });

  it("labels the account with its id when the provider gives no name", () => {
    expect(ConnectedAccount.create({ id: "acct_1" }).label).toBe("acct_1");
  });

  it("refuses an empty id", () => {
    expect(() => ConnectedAccount.create({ id: "" })).toThrow(TypeError);
  });
});
