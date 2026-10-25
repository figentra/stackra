/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogEntry`: a model with the `acl` public id, tenancy's tenant trait and the append-only
 *          trait, the four indexes its migration writes (the chain's unique one first), and the fields of an
 *          `AccessLink`.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0294 (decision 27); ADR 0321.
 */
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { AccessLink } from "#contracts/types/access-link.type";
import { AccessLogEntry } from "#node/models/access-log-entry.model";

describe("AccessLogEntry", () => {
  it("is a tenant-owned, append-only model with the acl public id", () => {
    expect(new AccessLogEntry()).toBeInstanceOf(Model);
    expect(traitsOf(AccessLogEntry).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "append_only",
    ]);
    expect(traitsOf(AccessLogEntry)[0]?.options).toEqual({ prefix: "acl" });
    expect(new AccessLogEntry().id).toMatch(/^acl_[0-9a-z]{26}$/);
  });

  it("declares the indexes its migration writes", () => {
    expect(Index.on(AccessLogEntry)).toEqual([
      { properties: ["tenantId", "sequence"], unique: true },
      { properties: ["tenantId", "callId"], unique: false },
      { properties: ["tenantId", "classification"], unique: false },
      { properties: ["at"], unique: false },
    ]);
  });

  it("is a stored access link", () => {
    expectTypeOf<AccessLogEntry>().toExtend<AccessLink>();
  });
});
