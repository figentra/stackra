/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentProofEntry`: a model with the `cpf` public id, tenancy's tenant trait and the
 *          append-only trait, and the two indexes its migration writes (the chain's unique one first).
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0294 (decision 27); ADR 0321; STA-2818.
 */
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { ConsentProofEntry } from "#node/models/consent-proof-entry.model";

describe("ConsentProofEntry", () => {
  it("is a tenant-owned, append-only model with the cpf public id", () => {
    expect(new ConsentProofEntry()).toBeInstanceOf(Model);
    expect(traitsOf(ConsentProofEntry).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "append_only",
    ]);
    expect(traitsOf(ConsentProofEntry)[0]?.options).toEqual({ prefix: "cpf" });
    expect(new ConsentProofEntry().id).toMatch(/^cpf_[0-9a-z]{26}$/);
  });

  it("declares the indexes its migration writes", () => {
    expect(Index.on(ConsentProofEntry)).toEqual([
      { properties: ["tenantId", "subject", "sequence"], unique: true },
      { properties: ["tenantId", "subject", "document"], unique: false },
    ]);
  });
});
