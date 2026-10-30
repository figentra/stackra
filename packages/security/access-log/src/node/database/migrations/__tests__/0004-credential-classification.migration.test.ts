/**
 * Stackra file contract:
 * Purpose: unit tests of `CredentialClassificationMigration`: it replaces the access record's classification check with
 *          one that lists every code `DataClassification` has, credential included, unvalidated, and its inverse
 *          restores the list without credential.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); ADR 0494.
 */
import { DataClassification, Enum } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CredentialClassificationMigration } from "#node/database/migrations/0004-credential-classification.migration";

describe("CredentialClassificationMigration", () => {
  const { steps } = compileMigration(CredentialClassificationMigration, { schema: "access_log" });
  const sql = steps.flatMap((step) => step.sql).join("\n");
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse)).join("\n");

  it("replaces the check with every classification code, unvalidated", () => {
    expect(sql).toContain('drop constraint if exists "ck_access_log_entries_classification"');
    for (const code of Enum.values(DataClassification)) expect(sql).toContain(`'${code}'`);
    expect(sql).toMatch(/'credential'\)\) not valid$/);
  });

  it("restores the check without credential as its inverse", () => {
    expect(inverse).toContain("'regulated'");
    expect(inverse).not.toContain("'credential'");
  });
});
