/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyAccount`: a scope-owned, versioned, soft-deleted model with the `lac` public id, an
 *          active bronze default, `canTransact` false once frozen, the pseudonymous member id, and the indexes and
 *          search facet its migration writes.
 * Boundary: test only; reads the recorded metadata, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0133; ADR 0134; ADR 0221.
 */
import { DataClassification } from "@stackra/contracts";
import { Index, Model, Searchable, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { Classified } from "@stackra/validation";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";

describe("LoyaltyAccount", () => {
  it("carries the id, scope, timestamps, version and soft-delete traits", () => {
    expect(new LoyaltyAccount()).toBeInstanceOf(Model);
    expect(traitsOf(LoyaltyAccount).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "timestamps",
      "versioned",
      "soft_deletes",
    ]);
    expect(new LoyaltyAccount().id).toMatch(/^lac_[0-9a-z]{26}$/);
  });

  it("starts active at bronze and stops transacting once frozen", () => {
    const account = new LoyaltyAccount();
    expect(account.tier).toBe(LoyaltyTier.Bronze);
    expect(account.canTransact).toBe(true);
    account.isFrozen = true;
    expect(account.canTransact).toBe(false);
  });

  it("classifies the member id as pseudonymous", () => {
    expect(Classified.members(LoyaltyAccount).get("memberId")).toBe(
      DataClassification.Pseudonymous,
    );
  });

  it("declares the indexes and search facet its migration writes", () => {
    expect(Index.on(LoyaltyAccount)).toEqual([
      { properties: ["tenantId", "memberId"], unique: true, where: "deleted_at is null" },
      { properties: ["tenantId", "tier"], unique: false },
      { properties: ["tenantId", "isFrozen"], unique: false },
      { properties: ["tenantId", "createdAt"], unique: false },
    ]);
    expect(Searchable.on(LoyaltyAccount)).toEqual({
      text: ["memberId"],
      filters: ["tier", "isFrozen", "createdAt"],
    });
  });
});
