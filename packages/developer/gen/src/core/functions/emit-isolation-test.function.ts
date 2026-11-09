/**
 * Stackra file contract:
 * Purpose: `emitIsolationTest`, a service's generated row-security test
 *          (`.stackra/tests/tenant-isolation.int.test.ts`): one Postgres with the service's compiled migrations
 *          (`.stackra/migrations`), then `assertRowSecurity` with `tenantIsolationOptions()` and, as `platform`, the
 *          tables of the service's `Model.global` models and `MODEL_SCOPE_EXEMPTIONS`, and as `migrationsDirectory` the
 *          compiled migrations, whose `t.platformTable` and `t.reviewedPolicy` declarations the audit reads (a declared
 *          platform table joins the platform list; a reviewed table must still enable and force row-level security
 *          and hold every policy it names): every other table holds the
 *          owner column under forced row-level security with its one permissive policy, the service role does not
 *          bypass it, and the two-owner probe sees and moves nothing. An unlisted table without `tenant_id` is a gap
 *          (the audit's default since the tenancy contract step), so the test fails on it.
 * Boundary: pure. Written only for a service that runs `@stackra/database`, `@stackra/tenancy` and `@stackra/testing`
 *           and has an owned model of its own or hosts a package that has one (its manifest's `models`). It lives in
 *           `.stackra/` as all generated output does, so the integration task must include `.stackra/tests/**` to run
 *           it; the unit config leaves `.int.test.ts` out.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (decision 1); ADR 0347 (decision 5); ADR 0182 (integration tier); ADR 0295
 *                     (generated output in `.stackra/`).
 */
import { MODEL_SCOPE_EXEMPTIONS } from "#core/constants/model-scope-exemptions.constant";
import { SCOPE_OWNER_TRAITS } from "#core/constants/scope-owner-traits.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import { tableName } from "#core/functions/table-name.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The isolation test of a service, or undefined when neither it nor a package it hosts has an owned model, or it misses
 * a package it needs.
 *
 * @example
 * emitIsolationTest(serviceIr); // "...const warnings = await assertRowSecurity(postgres.database, {..."
 */
export function emitIsolationTest(ir: MemberIR): string | undefined {
  const packages = ir.packages ?? [];
  if (
    ir.layout !== "service" ||
    !["@stackra/database", "@stackra/tenancy", "@stackra/testing"].every((name) =>
      packages.includes(name),
    ) ||
    (!ir.classes.some(
      (declared) =>
        declared.kind === "model" &&
        declared.traits.some((trait) => SCOPE_OWNER_TRAITS.includes(trait.name)),
    ) &&
      // The hosted packages' migrations build into the same database, so their owned tables need the test too.
      !ir.dependencies.some(
        ({ manifest }) =>
          manifest.kind !== "app" &&
          (manifest.models ?? []).some((model) =>
            model.traits.some((trait) => SCOPE_OWNER_TRAITS.includes(trait)),
          ),
      ))
  )
    return undefined;
  // The tables that hold no owner column by design: the service's global models and the ADR-named exemptions.
  const platform: [string, string][] = [
    ...ir.classes
      .filter((declared) => declared.kind === "model" && declared.global === true)
      .map((declared): [string, string] => [
        tableName(declared.module, declared.name),
        "Model.global (ADR 0210)",
      ]),
    ...MODEL_SCOPE_EXEMPTIONS,
  ];
  return [
    generatedHeader({
      from: "the models under src/ and .stackra/migrations",
      purpose: `the row-level security of ${ir.package}: every owned table is isolated.`,
      boundary:
        "integration tier (Docker); runs the compiled migrations, then the catalogue check and the two-owner probe.",
      runtime: "node",
    }),
    'import { fileURLToPath } from "node:url";',
    "",
    'import { assertRowSecurity, usePostgres } from "@stackra/database/testing";',
    'import { tenantIsolationOptions } from "@stackra/tenancy/testing";',
    'import { describe, it } from "@stackra/testing";',
    "",
    'const migrationsDirectory = fileURLToPath(new URL("../migrations", import.meta.url));',
    "const postgres = usePostgres({ migrationsDirectory });",
    "",
    'describe("row-level security", () => {',
    '  it("isolates every owned table", async () => {',
    "    const warnings = await assertRowSecurity(postgres.database, {",
    "      ...tenantIsolationOptions(),",
    // The compiled migrations' t.platformTable and t.reviewedPolicy declarations, which the audit reads and holds.
    "      migrationsDirectory,",
    "      platform: new Map([",
    ...platform.map(
      ([table, reason]) => `        [${JSON.stringify(table)}, ${JSON.stringify(reason)}],`,
    ),
    "      ]),",
    "    });",
    // Until 0.20 a table without tenant_id is a warning, printed so the service sees what is left.
    "    for (const warning of warnings) console.warn(`row-level security: ${warning}`);",
    "  });",
    "});",
    "",
  ].join("\n");
}
