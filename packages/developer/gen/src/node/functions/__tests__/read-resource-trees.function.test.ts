/**
 * Stackra file contract:
 * Purpose: unit tests of `readResourceTrees`: the cache module it writes describes each resource file once through
 *          the member's own `@stackra/panel`, every class in a tree written as `{ $class }`; a builder that throws is
 *          `builder_impure`, a file that fails to import is `resource_unloadable`, a resource with no loader is
 *          `resource_loader_missing`, and a member with no resource needs no loader.
 * Boundary: test only; writes a fixture member (a stub `@stackra/panel` under its node_modules) into a temporary folder
 *           and loads the cache module through vitest's own module loader.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 5); STA-1947.
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { LOYALTY_KIT_IR } from "#core/__tests__/fixtures/loyalty-kit-ir.fixture";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { MemberIR } from "#core/types/member-ir.type";
import { readResourceTrees } from "#node/functions/read-resource-trees.function";
import type { ModuleLoader } from "#node/types/module-loader.type";

let root = "";

/** Writes `text` at `path` under the fixture member. */
const write = (path: string, text: string): void => {
  const file = join(root, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, text);
};

/** A resource class of the fixture member. */
const resource = (name: string, file: string): DeclaredClass => ({
  name,
  kind: "resource",
  module: "loyalty_kit",
  file,
  importPath: `#${file}`,
  options: {},
  partner: { name: "LoyaltyAccount", from: "#node/models/loyalty-account.model" },
  deps: [],
  facets: [],
  methods: [],
  refusals: [],
  statics: {},
  traits: [],
});

/** The fixture IR with `classes` added. */
const irWith = (...classes: DeclaredClass[]): MemberIR => ({
  ...LOYALTY_KIT_IR,
  classes: [...LOYALTY_KIT_IR.classes, ...classes],
});

const load: ModuleLoader = async (file) =>
  (await import(/* @vite-ignore */ pathToFileURL(file).href)) as Record<string, unknown>;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-resource-trees-"));
  write("package.json", '{"name":"@acme/loyalty-kit","type":"module"}');
  // The stub describes a class by calling its static `tree`, which stands in for the builder members.
  write(
    "node_modules/@stackra/panel/package.json",
    '{"name":"@stackra/panel","type":"module","exports":"./index.js"}',
  );
  write(
    "node_modules/@stackra/panel/index.js",
    "export const describeResource = (type) => type.tree();\n",
  );
  write("src/node/actions/enroll.js", "export class EnrollMemberAction {}\n");
  write(
    "src/node/resources/good.resource.js",
    [
      'import { EnrollMemberAction } from "../actions/enroll.js";',
      "export class GoodResource {",
      "  static tree() { return { options: { operations: { create: EnrollMemberAction } }, table: { columns: [] } }; }",
      "}",
      "",
    ].join("\n"),
  );
  write(
    "src/node/resources/impure.resource.js",
    'export class ImpureResource { static tree() { throw new Error("reads this.orders"); } }\n',
  );
  write(
    "src/node/resources/broken.resource.js",
    'import "./missing.js";\nexport class BrokenResource {}\n',
  );
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("readResourceTrees", () => {
  it("describes each resource once, every class written as { $class }", async () => {
    const file = "src/node/resources/good.resource.js";
    const { trees, errors } = await readResourceTrees(
      root,
      irWith(resource("GoodResource", file)),
      load,
    );
    expect(errors).toEqual([]);
    expect(trees).toEqual({
      [file]: {
        options: { operations: { create: { $class: "EnrollMemberAction" } } },
        table: { columns: [] },
      },
    });
    expect(readFileSync(join(root, ".stackra/cache/resource-trees.ts"), "utf8")).toContain(
      'import { describeResource } from "@stackra/panel";',
    );
  });

  it("refuses a builder that throws and a file that fails to import, naming each", async () => {
    const { trees, errors } = await readResourceTrees(
      root,
      irWith(
        resource("ImpureResource", "src/node/resources/impure.resource.js"),
        resource("BrokenResource", "src/node/resources/broken.resource.js"),
      ),
      load,
    );
    expect(trees).toBeUndefined();
    expect(errors.map((error) => [error.code, error.subject])).toEqual([
      ["builder_impure", "ImpureResource"],
      ["resource_unloadable", "BrokenResource"],
    ]);
    expect(errors[0]?.message).toContain("reads this.orders");
  });

  it("refuses a resource with no loader and points at stackra gen", async () => {
    const { errors } = await readResourceTrees(
      root,
      irWith(resource("GoodResource", "src/node/resources/good.resource.js")),
      undefined,
    );
    expect(errors.map((error) => error.code)).toEqual(["resource_loader_missing"]);
    expect(errors[0]?.fix).toContain("stackra gen");
  });

  it("needs no loader for a member without a resource", async () => {
    expect(await readResourceTrees(root, LOYALTY_KIT_IR, undefined)).toEqual({ errors: [] });
  });
});
