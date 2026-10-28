/**
 * Stackra file contract:
 * Purpose: unit tests of `emitIsolationTest`: a service with an owned model and the database, tenancy and testing
 *          packages gets the row-security test over its compiled migrations; otherwise no file.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0239 (decision 1); ADR 0182.
 */
import { describe, expect, it } from "@stackra/testing";

import { emitIsolationTest } from "#core/functions/emit-isolation-test.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import type { MemberIR } from "#core/types/member-ir.type";

const OWNED: MemberIR = {
  ...COMMERCE_IR,
  packages: ["@stackra/database", "@stackra/tenancy", "@stackra/testing"],
  classes: COMMERCE_IR.classes.map((declared) =>
    declared.kind === "model"
      ? { ...declared, traits: [...declared.traits, { name: "BelongsToTenant", args: [] }] }
      : declared,
  ),
};

describe("emitIsolationTest", () => {
  it("checks every owned table of the compiled migrations", () => {
    const test = emitIsolationTest(OWNED) ?? "";
    expect(test).toContain(
      'import { assertRowSecurity, usePostgres } from "@stackra/database/testing";',
    );
    expect(test).toContain('import { tenantIsolationOptions } from "@stackra/tenancy/testing";');
    expect(test).toContain(
      'const postgres = usePostgres({ migrationsDirectory: fileURLToPath(new URL("../migrations", import.meta.url)) });',
    );
    expect(test).toContain(
      "    await assertRowSecurity(postgres.database, tenantIsolationOptions());",
    );
  });

  it("writes nothing without an owned model or a needed package", () => {
    expect(emitIsolationTest(COMMERCE_IR)).toBeUndefined();
    expect(
      emitIsolationTest({ ...OWNED, packages: ["@stackra/database", "@stackra/tenancy"] }),
    ).toBeUndefined();
    expect(emitIsolationTest({ ...OWNED, layout: "package" })).toBeUndefined();
  });
});
