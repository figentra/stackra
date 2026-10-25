/**
 * Stackra file contract:
 * Purpose: unit tests of `AddRuleSetSeedsMigration`: it adds the two nullable seed columns to `rules.rule_sets` and a
 *          partial unique index on the seeded copy of a template, consumer and scope.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; config-model section 6; ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddRuleSetSeedsMigration } from "#node/database/migrations/0002-add-rule-set-seeds.migration";

describe("AddRuleSetSeedsMigration", () => {
  const sql = compileMigration(AddRuleSetSeedsMigration, { schema: "rules" })
    .steps.flatMap((step) => step.sql)
    .join("\n");

  it("adds the nullable seed columns", () => {
    expect(sql).toContain('"seed_key" varchar(255)');
    expect(sql).toContain('"seed_version" varchar(31)');
    expect(sql).not.toMatch(/"seed_key" varchar\(255\) not null/);
  });

  it("keeps one seeded copy per template, consumer and scope", () => {
    expect(sql).toMatch(
      /create unique index .*"scope_id", "consumer", "seed_key".* where seed_key is not null/,
    );
  });
});
