/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreSqldbTypes` (STA-1795): a service with a database gets an ambient
 *          `encore.dev/storage/sqldb` module declaring the `SQLDatabase` its generated database file constructs and the
 *          `connectionString` its boot reads, as a script (no top-level import or export, so the declaration stays
 *          ambient); a package, an app and a service without a database get none, exactly when they get no database
 *          file.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0091 and ADR 0124.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreDatabase } from "#core/functions/emit-encore-database.function";
import { emitEncoreSqldbTypes } from "#core/functions/emit-encore-sqldb-types.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitEncoreSqldbTypes", () => {
  it("declares what the generated database file and boot use, as an ambient module", () => {
    const content = emitEncoreSqldbTypes(COMMERCE_IR) ?? "";
    expect(content).toContain('declare module "encore.dev/storage/sqldb" {');
    expect(content).toContain(
      "constructor(name: string, config?: { readonly migrations?: string });",
    );
    expect(content).toContain("readonly connectionString: string;");
    expect(content).not.toMatch(/^(import|export) /m);
  });

  it("is written exactly when the database file is", () => {
    for (const ir of [COMMERCE_IR, LOYALTY_KIT_IR, WEB_APP_IR, { ...COMMERCE_IR, classes: [] }])
      expect(emitEncoreSqldbTypes(ir) !== undefined).toBe(emitEncoreDatabase(ir) !== undefined);
    expect(emitEncoreSqldbTypes(LOYALTY_KIT_IR)).toBeUndefined();
    expect(emitEncoreSqldbTypes(WEB_APP_IR)).toBeUndefined();
  });
});
