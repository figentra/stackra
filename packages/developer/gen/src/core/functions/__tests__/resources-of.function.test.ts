/**
 * Stackra file contract:
 * Purpose: unit tests of `resourcesOf` and the manifest's `ui.resources`: a resource is recorded under
 *          `<module>.<model>` with its owning module, class, a package's `from` and its recorded tree, each action class
 *          in the tree as its locked key; an IR without trees records identities only; an unknown operation class and
 *          one key from two classes are refused; a host lists its hosted packages' resources once; a member with no
 *          resource gets no `ui` section.
 * Boundary: test only; runs on the loyalty kit IR fixture with one resource added.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 5); ADR 0111 (decision 3); STA-1947.
 */
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { resourcesOf } from "#core/functions/resources-of.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";
import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";

const FILE = "src/node/resources/loyalty-account/loyalty-account.resource.ts";

const RESOURCE: DeclaredClass = {
  name: "LoyaltyAccountResource",
  kind: "resource",
  module: "loyalty_kit",
  file: FILE,
  importPath: "#node/resources/loyalty-account/loyalty-account.resource",
  options: {},
  partner: { name: "LoyaltyAccount", kind: "model", from: "#node/models/loyalty-account.model" },
  deps: [],
  facets: [],
  methods: ["table"],
  refusals: [],
  statics: {},
  traits: [],
};

const TREE = {
  options: { area: "admin", operations: { list: true, create: { $class: "RedeemPointsAction" } } },
  table: { columns: [{ kind: "value", key: "memberId" }] },
  actions: [{ kind: "run", action: { $class: "RedeemPointsAction" } }],
};

const BARE: MemberIR = { ...LOYALTY_KIT_IR, classes: [...LOYALTY_KIT_IR.classes, RESOURCE] };

const IR: MemberIR = { ...BARE, resourceTrees: { [FILE]: TREE } };

describe("resourcesOf", () => {
  it("records the tree under <module>.<model> with its module, class and package entry", () => {
    const { manifest, errors } = buildManifest(IR);
    expect(errors).toEqual([]);
    expect((manifest["ui"] as { resources: unknown }).resources).toEqual({
      "loyalty_kit.loyalty_account": {
        module: "loyalty_kit",
        class: "LoyaltyAccountResource",
        from: "@acme/loyalty-kit/node",
        options: {
          area: "admin",
          operations: { list: true, create: "loyalty_kit.loyalty_account.redeem@1" },
        },
        table: { columns: [{ kind: "value", key: "memberId" }] },
        actions: [{ kind: "run", action: "loyalty_kit.loyalty_account.redeem@1" }],
      },
    });
  });

  it("records the identity alone for an IR without trees", () => {
    const { resources } = resourcesOf(BARE, []);
    expect(resources).toEqual({
      "loyalty_kit.loyalty_account": {
        module: "loyalty_kit",
        class: "LoyaltyAccountResource",
        from: "@acme/loyalty-kit/node",
      },
    });
  });

  it("refuses an operation class that is no known action or query", () => {
    const { errors } = resourcesOf(
      {
        ...IR,
        resourceTrees: { [FILE]: { options: { operations: { get: { $class: "Nope" } } } } },
      },
      [],
    );
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["resource_operation_unknown", "LoyaltyAccountResource.get"],
    ]);
  });

  it("refuses one key declared by two classes", () => {
    const twin = {
      ...RESOURCE,
      name: "OtherAccountResource",
      file: "src/node/resources/x.resource.ts",
    };
    const { errors } = resourcesOf({ ...BARE, classes: [...BARE.classes, twin] }, []);
    expect(errors.map((error) => error.code)).toEqual(["resource_duplicate"]);
  });

  it("lets a host list its hosted package's resources once", () => {
    const hosted = buildManifest(IR).manifest;
    const host: MemberIR = {
      ...COMMERCE_IR,
      dependencies: [
        { package: "@acme/loyalty-kit", manifest: hosted },
        { package: "@acme/again", manifest: hosted },
      ],
    };
    const { resources, errors } = resourcesOf(host, []);
    expect(errors).toEqual([]);
    expect(Object.keys(resources)).toEqual(["loyalty_kit.loyalty_account"]);
    expect(resources["loyalty_kit.loyalty_account"]?.["from"]).toBe("@acme/loyalty-kit/node");
  });

  it("writes no ui section for a member without a resource", () => {
    expect(buildManifest(LOYALTY_KIT_IR).manifest["ui"]).toBeUndefined();
  });
});
