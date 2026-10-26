/**
 * Stackra file contract:
 * Purpose: unit tests of `generate`: a write run puts the manifest, schemas, wiring and entries on disk; a second run
 *          changes nothing; a check run reports a stale file without writing; a changed identity without `@Renamed`
 *          fails against the committed manifest and writes nothing; a member consuming a workspace service with no
 *          manifest yet gets its manifest alone (with `pass: "manifests"`, or as what a refused run still writes).
 * Boundary: test only; writes the shop fixture under `.cache/` and runs gen on it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 22); ADR 0295 (decision 5).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { describe, expect, it } from "@stackra/testing";

import { generate } from "#node/functions/generate.function";
import { SHOP_SOURCES } from "#node/__tests__/fixtures/shop-sources.fixture";
import { writeFixtureMember } from "#node/__tests__/fixtures/write-fixture-member";

describe("generate", () => {
  it("writes, then finds nothing to change, then checks", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    const first = await generate(root);
    expect(first.errors).toEqual([]);
    expect(first.changed).toEqual(
      expect.arrayContaining([
        "stackra.manifest.json",
        ".stackra/gen/wiring.ts",
        ".stackra/entry/node.ts",
      ]),
    );
    expect(existsSync(join(root, ".stackra/gen/schemas/shop.ts"))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(root, "stackra.manifest.json"), "utf8")) as {
      actions: { key: string }[];
    };
    expect(manifest.actions.map((action) => action.key)).toEqual(["shop.order.cancel@1"]);

    expect((await generate(root)).changed).toEqual([]);

    writeFileSync(join(root, ".stackra/gen/wiring.ts"), "// edited by hand\n");
    const check = await generate(root, { check: true });
    expect(check.changed).toEqual([".stackra/gen/wiring.ts"]);
    expect(readFileSync(join(root, ".stackra/gen/wiring.ts"), "utf8")).toBe("// edited by hand\n");
  });

  it("refuses a changed identity without @Renamed", async () => {
    const root = writeFixtureMember("shop", SHOP_SOURCES);
    await generate(root);
    const action = join(root, "src/node/actions/cancel-order.action.ts");
    writeFileSync(
      action,
      readFileSync(action, "utf8").replace('key: "order.cancel"', 'key: "order.void"'),
    );
    const permissions = join(root, "src/node/access/order.permissions.ts");
    writeFileSync(
      permissions,
      readFileSync(permissions, "utf8").replace("static readonly cancel", "static readonly void"),
    );
    const result = await generate(root);
    expect(result.errors.map((error) => error.code)).toEqual(["identity_changed"]);
    expect(result.changed).toEqual([]);
  });
});

/** A member injecting the catalogue client, with a catalogue folder (no manifest yet) beside it. */
function waitingMember(): string {
  const root = writeFixtureMember("channels", {
    "src/core/services/sync.service.ts": [
      'import { Service } from "@stackra/container";',
      'import type { CatalogueClient } from "#stackra/clients/catalogue";',
      "export class SyncService extends Service {",
      "  constructor(private readonly catalogue: CatalogueClient) {",
      "    super();",
      "  }",
      "}",
      "",
    ].join("\n"),
  });
  mkdirSync(join(dirname(root), "catalogue"), { recursive: true });
  writeFileSync(join(dirname(root), "catalogue", "package.json"), "{}");
  return root;
}

describe("generate across a cycle between services", () => {
  it("writes the manifest alone in the manifest pass", async () => {
    const root = waitingMember();
    const result = await generate(root, { pass: "manifests" });
    expect(result.errors).toEqual([]);
    expect(result.changed).toEqual(["stackra.manifest.json"]);
    expect(existsSync(join(root, ".stackra/gen/wiring.ts"))).toBe(false);
  });

  it("refuses the full run but still writes the manifest", async () => {
    const root = waitingMember();
    const result = await generate(root);
    expect(result.errors.map((error) => error.code)).toEqual(["client_service_unknown"]);
    expect(result.changed).toEqual(["stackra.manifest.json"]);
    expect(existsSync(join(root, ".stackra/gen/wiring.ts"))).toBe(false);
    expect((await generate(root, { check: true })).changed).toEqual([]);
  });
});
