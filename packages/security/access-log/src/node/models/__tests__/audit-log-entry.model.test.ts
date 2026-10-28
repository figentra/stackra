/**
 * Stackra file contract:
 * Purpose: unit tests of `AuditLogEntry`: a model with the `aud` public id, tenancy's tenant trait and the append-only
 *          trait, the four indexes its migration writes (the chain's unique one first), and the fields of an
 *          `AuditLink`.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0212 (decision 3); ADR 0294 (decision 27); ADR 0465 (decision 4).
 */
import { Index, Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { AuditLink } from "#contracts/types/audit-link.type";
import { AuditLogEntry } from "#node/models/audit-log-entry.model";

describe("AuditLogEntry", () => {
  it("is a tenant-owned, append-only model with the aud public id", () => {
    expect(new AuditLogEntry()).toBeInstanceOf(Model);
    expect(traitsOf(AuditLogEntry).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "belongs_to_tenant",
      "append_only",
    ]);
    expect(traitsOf(AuditLogEntry)[0]?.options).toEqual({ prefix: "aud" });
    expect(new AuditLogEntry().id).toMatch(/^aud_[0-9a-z]{26}$/);
  });

  it("declares the indexes its migration writes", () => {
    expect(Index.on(AuditLogEntry)).toEqual([
      { properties: ["tenantId", "sequence"], unique: true },
      { properties: ["tenantId", "callId"], unique: false },
      { properties: ["tenantId", "key"], unique: false },
      { properties: ["at"], unique: false },
    ]);
  });

  it("is a stored audit link", () => {
    expectTypeOf<AuditLogEntry>().toExtend<AuditLink>();
  });
});
