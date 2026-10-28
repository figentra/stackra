/**
 * Stackra file contract:
 * Purpose: `emitIsolationTest`, a service's generated row-security test
 *          (`.stackra/tests/tenant-isolation.int.test.ts`): one Postgres with the service's compiled migrations
 *          (`.stackra/migrations`), then `assertRowSecurity` with `tenantIsolationOptions()`: every table with the owner
 *          column is under forced row-level security with its policy, the service role does not bypass it, and the
 *          two-owner probe sees and moves nothing.
 * Boundary: pure. Written only for a service that runs `@stackra/database`, `@stackra/tenancy` and `@stackra/testing`
 *           and has an owned model. It lives in `.stackra/` as all generated output does, so the integration task must
 *           include `.stackra/tests/**` to run it; the unit config leaves `.int.test.ts` out.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (decision 1); ADR 0182 (integration tier); ADR 0295 (generated output in `.stackra/`).
 */
import { SCOPE_OWNER_TRAITS } from "#core/constants/scope-owner-traits.constant";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The isolation test of a service, or undefined when it has no owned model or misses a package it needs.
 *
 * @example
 * emitIsolationTest(serviceIr); // "...await assertRowSecurity(postgres.database, tenantIsolationOptions());..."
 */
export function emitIsolationTest(ir: MemberIR): string | undefined {
  const packages = ir.packages ?? [];
  if (
    ir.layout !== "service" ||
    !["@stackra/database", "@stackra/tenancy", "@stackra/testing"].every((name) =>
      packages.includes(name),
    ) ||
    !ir.classes.some(
      (declared) =>
        declared.kind === "model" &&
        declared.traits.some((trait) => SCOPE_OWNER_TRAITS.includes(trait.name)),
    )
  )
    return undefined;
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
    'const postgres = usePostgres({ migrationsDirectory: fileURLToPath(new URL("../migrations", import.meta.url)) });',
    "",
    'describe("row-level security", () => {',
    '  it("isolates every owned table", async () => {',
    "    await assertRowSecurity(postgres.database, tenantIsolationOptions());",
    "  });",
    "});",
    "",
  ].join("\n");
}
