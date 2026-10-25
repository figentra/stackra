/**
 * Stackra file contract:
 * Purpose: unit tests of `generateMember`: the full file set of a service (manifest, openapi, one schemas file per
 *          module, wiring, member module, server entry) and of a package (no openapi, entry barrels), no file at all
 *          when discovery, the manifest or the identity lock refuses, and `@Renamed` accepted by the lock.
 * Boundary: test only; runs on the IR fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10, 22 and 26); ADR 0295 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { generateMember } from "#core/functions/generate-member.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";

describe("generateMember", () => {
  it("writes every file of a service", () => {
    const { files, errors, manifest } = generateMember(COMMERCE_IR);
    expect(errors).toEqual([]);
    expect(files.map((file) => file.path)).toEqual([
      "stackra.manifest.json",
      "openapi.json",
      ".stackra/gen/schemas/commerce.ts",
      ".stackra/gen/schemas/orders.ts",
      ".stackra/gen/wiring.ts",
      ".stackra/gen/module.ts",
      ".stackra/entry/server.ts",
    ]);
    expect(JSON.parse(files[0]?.content ?? "{}")).toEqual(JSON.parse(JSON.stringify(manifest)));
    expect(files[0]?.content.endsWith("}\n")).toBe(true);
  });

  it("writes entry barrels and no openapi for a package", () => {
    const paths = generateMember(LOYALTY_KIT_IR).files.map((file) => file.path);
    expect(paths).not.toContain("openapi.json");
    expect(paths).toContain(".stackra/entry/node.ts");
    expect(paths).not.toContain(".stackra/entry/server.ts");
  });

  it("writes nothing when any check refuses", () => {
    const refused = {
      ...COMMERCE_IR,
      errors: [
        {
          code: "shape_number_kind",
          file: "x.ts",
          line: 1,
          column: 1,
          subject: "X.n",
          message: "m",
          fix: "f",
        },
      ],
    };
    expect(generateMember(refused)).toMatchObject({
      files: [],
      errors: [{ code: "shape_number_kind" }],
    });
  });

  it("locks identities against the committed manifest unless renamed", () => {
    const committed = generateMember(COMMERCE_IR).manifest;
    const renamedKey = {
      ...COMMERCE_IR,
      classes: COMMERCE_IR.classes.map((declared) =>
        declared.name === "CancelOrderAction"
          ? { ...declared, options: { ...declared.options, key: "order.void" } }
          : declared,
      ),
    };
    const permissions = renamedKey.classes.map((declared) =>
      declared.name === "OrderPermissions"
        ? { ...declared, statics: { ...declared.statics, void: "Permission.L2" } }
        : declared,
    );
    const changed = generateMember({ ...renamedKey, classes: permissions }, committed);
    expect(changed.errors.map((error) => error.code)).toEqual(["identity_changed"]);
    const accepted = generateMember(
      {
        ...renamedKey,
        classes: permissions.map((declared) =>
          declared.name === "CancelOrderAction"
            ? { ...declared, renamed: "order.cancel" }
            : declared,
        ),
      },
      committed,
    );
    expect(accepted.errors).toEqual([]);
  });
});
