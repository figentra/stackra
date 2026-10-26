/**
 * Stackra file contract:
 * Purpose: unit tests of `undeclaredPackages`: one refusal per generated file and undeclared `@stackra/*` package
 *          (named, value, type-only and side-effect imports, subpaths by their package root), none for a declared
 *          package, the member's own package or an IR without `packages`; and `generateMember` refusing a schema
 *          that imports an undeclared package.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 10); STA-1293.
 */
import { describe, expect, it } from "@stackra/testing";

import { generateMember } from "#core/functions/generate-member.function";
import { undeclaredPackages } from "#core/functions/undeclared-packages.function";
import { BILLING_IR } from "#core/__tests__/fixtures/billing-ir.fixture";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

const FILE = {
  path: ".stackra/gen/clients/catalogue.ts",
  content: [
    "/**",
    ' * import { x } from "@stackra/ignored";',
    " */",
    'import { ServiceClient, remoteQuery } from "@stackra/clients";',
    'import type { ClientTransport } from "@stackra/clients/contracts";',
    'import { ErrorKind } from "@stackra/errors";',
    'import "@stackra/database/testing";',
    'import { z } from "zod";',
    'import { Self } from "@acme/self";',
  ].join("\n"),
};

describe("undeclaredPackages", () => {
  it("refuses each undeclared @stackra package once, by its root", () => {
    const errors = undeclaredPackages(
      { ...COMMERCE_IR, packages: ["@stackra/errors"] },
      [FILE],
      "client_dependency_missing",
    );
    expect(errors.map((error) => error.subject)).toEqual(["@stackra/clients", "@stackra/database"]);
    expect(errors[0]).toMatchObject({
      code: "client_dependency_missing",
      file: ".stackra/gen/clients/catalogue.ts",
      fix: 'add "@stackra/clients" to the dependencies in package.json',
    });
  });

  it("allows declared packages, the member itself and a hand-built IR", () => {
    expect(
      undeclaredPackages(
        {
          ...COMMERCE_IR,
          package: "@stackra/database",
          packages: ["@stackra/clients", "@stackra/errors"],
        },
        [FILE],
        "client_dependency_missing",
      ),
    ).toEqual([]);
    expect(undeclaredPackages(COMMERCE_IR, [FILE], "client_dependency_missing")).toEqual([]);
  });

  it("makes generateMember refuse a schema importing an undeclared package", () => {
    const { files, errors } = generateMember({
      ...BILLING_IR,
      packages: (BILLING_IR.packages ?? []).filter((name) => name !== "@stackra/money"),
    });
    expect(files).toEqual([]);
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["schema_dependency_missing", "@stackra/money"],
    ]);
  });
});
