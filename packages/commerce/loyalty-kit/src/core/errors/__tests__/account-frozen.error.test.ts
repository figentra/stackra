/**
 * Stackra file contract:
 * Purpose: unit tests of `AccountFrozenError`: a non-retryable `conflict` refusal, code `account_frozen`, naming the
 *          frozen account.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0232; ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { AccountFrozenError } from "#core/errors/account-frozen.error";

describe("AccountFrozenError", () => {
  it("is a conflict naming the frozen account", () => {
    const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;
    const refusal = AccountFrozenError.create({ accountId });
    expect(refusal.kind).toBe(ErrorKind.Conflict);
    expect(refusal.code).toBe("account_frozen");
    expect(refusal.retryable).toBe(false);
    expect(refusal.accountId).toBe(accountId);
  });
});
