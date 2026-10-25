/**
 * Stackra file contract:
 * Purpose: unit tests of `TENANT_SCOPE_ALIAS`: the lang key `tenancy::levels.tenant`, which the shipped catalogues hold
 *          in every locale and `scopeLevelLabel` returns once a deployment sets it as the tenant level's alias.
 * Boundary: test only; reads the shipped catalogues from `assets/lang/{en,ar}/tenancy.json`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0327 (decision 4).
 */
import { readFileSync } from "node:fs";

import { scopeLevelLabel } from "@stackra/scope";
import { describe, expect, it } from "@stackra/testing";

import { TENANT_SCOPE_ALIAS } from "#core/constants/tenant-scope-alias.constant";
import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";

/** The shipped catalogue of `locale`. */
const catalogue = (locale: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../../assets/lang/${locale}/tenancy.json`, import.meta.url),
      "utf8",
    ),
  ) as { levels: Record<string, string> };

describe("TENANT_SCOPE_ALIAS", () => {
  it("names a label every shipped locale holds", () => {
    expect(TENANT_SCOPE_ALIAS).toBe("tenancy::levels.tenant");
    for (const locale of ["en", "ar"])
      expect(catalogue(locale).levels[TenancyScopes.Tenant]).toBeTypeOf("string");
  });

  it("is the tenant level's label once a deployment sets it as the alias", () => {
    const aliases = { [TenancyScopes.Tenant]: TENANT_SCOPE_ALIAS };
    expect(scopeLevelLabel({ aliases }, TenancyScopes.Tenant)).toBe(TENANT_SCOPE_ALIAS);
  });
});
