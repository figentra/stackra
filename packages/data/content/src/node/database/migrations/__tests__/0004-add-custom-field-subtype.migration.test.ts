/**
 * Stackra file contract:
 * Purpose: unit tests of `AddCustomFieldSubtypeMigration`: the `subtype` column in the transactional step, then the
 *          new unique index and the drop of the old one, each online and in that order.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159; ADR 0116 (decision CT2) as amended by ADR 0226.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddCustomFieldSubtypeMigration } from "#node/database/migrations/0004-add-custom-field-subtype.migration";

describe("AddCustomFieldSubtypeMigration", () => {
  it("adds the column, builds the new unique index, then drops the old one", () => {
    const [step, unique, drop] = compileMigration(AddCustomFieldSubtypeMigration, {
      schema: "content",
    }).steps;
    expect(step?.transactional).toBe(true);
    expect(step?.sql.join("\n")).toContain('"subtype" varchar(63) not null');
    expect(unique?.transactional).toBe(false);
    expect(unique?.sql[0]).toMatch(
      /create unique index concurrently .*\("scope_id", "model", "subtype", "key"\)/,
    );
    expect(drop?.transactional).toBe(false);
    expect(drop?.sql[0]).toMatch(
      /drop index concurrently if exists .*idx_custom_fields_scope_id_model_key/,
    );
  });
});
