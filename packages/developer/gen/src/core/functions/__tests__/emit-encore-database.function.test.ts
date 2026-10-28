/**
 * Stackra file contract:
 * Purpose: unit tests of `emitEncoreDatabase`: a service with a model gets one `SQLDatabase` named after the member,
 *          its migrations the compiled `.stackra/migrations` folder; a package, an app or a service without a database
 *          gets no file.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0238; ADR 0159; stackra-250.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitEncoreDatabase } from "#core/functions/emit-encore-database.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import { WEB_APP_IR } from "#core/__tests__/fixtures/web-app-ir.fixture";

describe("emitEncoreDatabase", () => {
  it("declares the service's database over the compiled migrations", () => {
    const file = emitEncoreDatabase(COMMERCE_IR);
    expect(file?.path).toBe(".stackra/encore/commerce/database.ts");
    expect(file?.content).toContain('import { SQLDatabase } from "encore.dev/storage/sqldb";');
    expect(file?.content).toContain(
      [
        'export const database = new SQLDatabase("commerce", {',
        '  migrations: "../../migrations",',
        "});",
      ].join("\n"),
    );
  });

  it("names the database in snake case", () => {
    expect(emitEncoreDatabase({ ...COMMERCE_IR, member: "order-desk" })?.content).toContain(
      'new SQLDatabase("order_desk", {',
    );
  });

  it("writes nothing for a package, an app or a service without a database", () => {
    expect(emitEncoreDatabase(LOYALTY_KIT_IR)).toBeUndefined();
    expect(emitEncoreDatabase(WEB_APP_IR)).toBeUndefined();
    expect(emitEncoreDatabase({ ...COMMERCE_IR, classes: [] })).toBeUndefined();
  });
});
