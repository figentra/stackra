/**
 * Stackra file contract:
 * Purpose: unit tests of `emitMigrationsCheck`: the PGlite check and the Postgres check of a package's compiled
 *          migrations, each over `.stackra/tests/migrations`, the Postgres fixture starting empty.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159; STA-1689.
 */
import { describe, expect, it } from "@stackra/testing";

import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { emitMigrationsCheck } from "#core/functions/emit-migrations-check.function";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("emitMigrationsCheck", () => {
  const files = emitMigrationsCheck(LOYALTY_KIT_IR);
  const content = (path: string): string => files.find((file) => file.path === path)?.content ?? "";

  it("writes a PGlite check and a Postgres check", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/tests/migrations.test.ts",
      ".stackra/tests/migrations.int.test.ts",
    ]);
    expect(content(".stackra/tests/migrations.test.ts")).toContain(GENERATED_NOTICE);
  });

  it("checks the compiled folder beside it on PGlite", () => {
    expect(content(".stackra/tests/migrations.test.ts")).toContain(
      'await checkMigrations(fileURLToPath(new URL("./migrations", import.meta.url)));',
    );
  });

  it("checks it on an empty Postgres in the integration tier", () => {
    const postgres = content(".stackra/tests/migrations.int.test.ts");
    expect(postgres).toContain("const postgres = usePostgres({ migrations: [] });");
    expect(postgres).toContain("{ exec: (sql) => connection.execute(sql) }");
  });
});
