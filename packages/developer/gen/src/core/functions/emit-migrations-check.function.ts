/**
 * Stackra file contract:
 * Purpose: `emitMigrationsCheck`, the check of a package's own compiled migrations (STA-1689):
 *          `.stackra/tests/migrations.test.ts`, which applies, reverts and re-applies `.stackra/tests/migrations` on a
 *          fresh PGlite (unit tier), and `.stackra/tests/migrations.int.test.ts`, which does the same on a fresh
 *          Postgres (integration tier, Docker) with `checkMigrations` of `@stackra/database/testing`.
 * Boundary: pure; `generate` writes it beside the package's compiled migrations, only when the package has its own.
 *           The Postgres fixture starts empty (`migrations: []`), so the check itself creates everything.
 * Runtime: isomorphic
 * Governing contract: ADR 0159; ADR 0182 (integration tier); ADR 0295 (generated output in `.stackra/`); STA-1689.
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The generated tests' timeout, in milliseconds. */
const TIMEOUT_MS = 120_000;

/**
 * The migration check files of the package `ir`.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitMigrationsCheck(ir).map((file) => file.path); // [".stackra/tests/migrations.test.ts", ".stackra/tests/migrations.int.test.ts"]
 */
export function emitMigrationsCheck(ir: MemberIR): GeneratedFile[] {
  const folder = 'fileURLToPath(new URL("./migrations", import.meta.url))';
  const header = (tier: string): string =>
    generatedHeader({
      from: "the package's migrations under src/node/database/migrations",
      purpose: `the migration check of ${ir.package} on ${tier}: every up applies, reverts while a down exists, and applies again.`,
      boundary:
        "runs .stackra/tests/migrations, compiled by gen with the declared packages' migrations it builds on.",
      runtime: "node",
    });
  return [
    {
      path: ".stackra/tests/migrations.test.ts",
      content: [
        header("PGlite"),
        'import { fileURLToPath } from "node:url";',
        "",
        'import { checkMigrations } from "@stackra/database/testing";',
        'import { describe, it } from "@stackra/testing";',
        "",
        'describe("migrations", () => {',
        '  it("apply, revert and apply again on PGlite", async () => {',
        `    await checkMigrations(${folder});`,
        // PGlite starts, loads the extensions and runs every migration three ways: far past the 5 s default.
        `  }, ${TIMEOUT_MS});`,
        "});",
        "",
      ].join("\n"),
    },
    {
      path: ".stackra/tests/migrations.int.test.ts",
      content: [
        header("Postgres"),
        'import { fileURLToPath } from "node:url";',
        "",
        'import { checkMigrations, usePostgres } from "@stackra/database/testing";',
        'import { describe, it } from "@stackra/testing";',
        "",
        "const postgres = usePostgres({ migrations: [] });",
        "",
        'describe("migrations on Postgres", () => {',
        '  it("apply, revert and apply again", async () => {',
        "    const connection = postgres.database.em().getConnection();",
        `    await checkMigrations(${folder}, { exec: (sql) => connection.execute(sql) });`,
        `  }, ${TIMEOUT_MS});`,
        "});",
        "",
      ].join("\n"),
    },
  ];
}
