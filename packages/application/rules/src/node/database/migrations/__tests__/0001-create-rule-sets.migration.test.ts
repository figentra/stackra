/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateRuleSetsMigration`: it compiles to one transactional step that creates the `ltree`
 *          extension and `rules.rule_sets` with its public id key, scope columns, a text consumer with no check
 *          constraint and the forced scope policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decision 5); ADR 0327 (decision 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateRuleSetsMigration } from "#node/database/migrations/0001-create-rule-sets.migration";

describe("CreateRuleSetsMigration", () => {
  const { after, steps } = compileMigration(CreateRuleSetsMigration, {
    schema: "rules",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = (step?.sql ?? []).join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the rule set table with its columns", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "rules"."rule_sets"');
    expect(sql).toContain('"consumer" varchar(127) not null');
    expect(sql).not.toContain("ck_rule_sets_consumer");
  });

  it("forces the scope policy", () => {
    expect(sql).toContain('alter table "rules"."rule_sets" force row level security');
    expect(sql).toContain(`current_setting('app.scope_paths', true)`);
    expect(sql).toContain('using gist ("scope_path")');
  });
});
