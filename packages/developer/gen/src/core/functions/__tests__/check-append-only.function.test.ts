/**
 * Stackra file contract:
 * Purpose: unit tests of `checkAppendOnly`: an own `AppendOnly` model whose table no compiled migration revokes
 *          `UPDATE` on is refused as `append_only_not_revoked`, one with the revoke passes, and a model without the
 *          trait or without a migrated module is left alone.
 * Boundary: test only; runs on the billing IR fixture with its first model made append-only and hand-written units.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0134; ADR 0220; data-layer gap db5 (stackra-256).
 */
import { describe, expect, it } from "@stackra/testing";

import { checkAppendOnly } from "#core/functions/check-append-only.function";
import { tableName } from "#core/functions/table-name.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { MigrationUnit } from "#core/types/migration-unit.type";

const MODEL = BILLING_IR.classes.find((declared) => declared.kind === "model") as DeclaredClass;
const [SCHEMA, TABLE] = tableName(MODEL.module, MODEL.name).split(".");

/** The fixture with the first model append-only when `appendOnly` is set. */
const ir = (appendOnly: boolean): MemberIR => ({
  ...BILLING_IR,
  classes: BILLING_IR.classes.map((declared) =>
    declared === MODEL && appendOnly
      ? { ...declared, traits: [...declared.traits, { name: "AppendOnly", args: [] }] }
      : declared,
  ),
});

/** One migration of the model's module running `sql`. */
const unit = (...sql: string[]): MigrationUnit => ({
  id: `${MODEL.module}.0001_create`,
  owner: "member",
  file: "src/modules/x/database/migrations/0001-create.migration.ts",
  after: [],
  steps: [{ sql, transactional: true, inverse: [] }],
});

describe("checkAppendOnly", () => {
  it("refuses an append-only model whose table keeps UPDATE", () => {
    const [error] = checkAppendOnly(ir(true), [unit(`create table "${SCHEMA}"."${TABLE}" ()`)]);
    expect(error?.code).toBe("append_only_not_revoked");
    expect(error?.subject).toBe(MODEL.name);
  });

  it("passes the revoke, a model without the trait and a module with no migration", () => {
    expect(
      checkAppendOnly(ir(true), [
        unit(`revoke update on "${SCHEMA}"."${TABLE}" from public, current_user`),
      ]),
    ).toEqual([]);
    expect(checkAppendOnly(ir(false), [unit("select 1")])).toEqual([]);
    expect(checkAppendOnly(ir(true), [])).toEqual([]);
  });
});
