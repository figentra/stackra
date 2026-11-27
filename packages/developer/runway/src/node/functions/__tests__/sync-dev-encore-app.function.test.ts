/**
 * Stackra file contract:
 * Purpose: unit tests of `syncDevEncoreApp` and `syncDevEncoreMember`: two service members become one Encore app under
 *          `.stackra/dev/encore` (one `encore.app` with their id, `encore.dev` from their dependencies, each member's
 *          sources with `#` imports rewritten and no `__tests__`, its assets and a `node_modules` link); a second sync
 *          writes nothing, an edit rewrites one file, a deleted source and a dropped member leave the app; two app ids,
 *          an unresolvable alias and no member are refused.
 * Boundary: test only; temporary repositories, nothing started.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0296 (decision 3); ADR 0091 (decision 2); STA-2840.
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "@stackra/testing";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { syncDevEncoreApp } from "#node/functions/sync-dev-encore-app.function";
import { syncDevEncoreMember } from "#node/functions/sync-dev-encore-member.function";

let repository: string;

/** Writes `content` at `path` under the repository, creating its folders. */
function write(path: string, content: string): void {
  const file = join(repository, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, content);
}

/** Reads `path` under the repository's local monolith app. */
const app = (path: string): string =>
  readFileSync(join(repository, ".stackra/dev/encore", path), "utf8");

/** One service member's package.json, with the house `imports` map. */
const manifest = (name: string): string =>
  JSON.stringify({
    name: `@acme/${name}-service`,
    dependencies: { "encore.dev": "1.58.8" },
    imports: {
      "#modules/*": ["./src/modules/*", "./src/modules/*.ts", "./src/modules/*/index.ts"],
      "#stackra/*": ["./.stackra/gen/*", "./.stackra/gen/*.ts"],
      "#assets/*": "./assets/*",
    },
  });

/** The absolute roots of the members. */
const members = (...names: string[]): string[] =>
  names.map((name) => join(repository, "services", name));

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "stackra-dev-encore-"));
  for (const name of ["billing", "usage"]) {
    write(`services/${name}/package.json`, manifest(name));
    write(`services/${name}/tsconfig.json`, "{}\n");
    write(`services/${name}/encore.app`, '{ "id": "acme-x1", "lang": "typescript" }\n');
    write(`services/${name}/src/modules/orders/index.ts`, "export const orders = 1;\n");
    write(
      `services/${name}/src/modules/orders/__tests__/orders.test.ts`,
      'import { orders } from "#modules/orders";\n',
    );
    write(`services/${name}/.stackra/gen/wiring.ts`, 'export * from "#modules/orders";\n');
    write(
      `services/${name}/stackra-encore/${name}/encore.service.ts`,
      `import "#stackra/wiring";\nimport rows from "#assets/rows.json" with { type: "json" };\nexport default rows;\n`,
    );
    write(`services/${name}/stackra-encore/${name}/migrations/1_init.up.sql`, "select 1;\n");
    write(`services/${name}/assets/rows.json`, "[]\n");
    mkdirSync(join(repository, "services", name, "node_modules"), { recursive: true });
  }
});

describe("syncDevEncoreApp", () => {
  it("builds one Encore app of every service member", () => {
    const synced = syncDevEncoreApp({ repository, members: members("usage", "billing") });

    expect(synced.root).toBe(join(repository, ".stackra/dev/encore"));
    expect(synced.members).toEqual(["services/billing", "services/usage"]);
    expect(JSON.parse(app("encore.app"))).toEqual({ id: "acme-x1", lang: "typescript" });
    expect(JSON.parse(app("package.json")).dependencies).toEqual({ "encore.dev": "1.58.8" });
    expect(JSON.parse(app("tsconfig.json")).compilerOptions.experimentalDecorators).toBe(true);
    // Each member's `#` imports become relative paths through its own map (the expected text is built, so the
    // repository's import check does not read it as an import of this test).
    const up = "../..";
    expect(app("services/billing/.stackra/gen/wiring.ts")).toBe(
      `export * from "${up}/src/modules/orders";\n`,
    );
    expect(app("services/usage/stackra-encore/usage/encore.service.ts")).toContain(
      'import "../../.stackra/gen/wiring";\nimport rows from "../../assets/rows.json"',
    );
    expect(app("services/usage/stackra-encore/usage/migrations/1_init.up.sql")).toBe("select 1;\n");
    expect(app("services/usage/assets/rows.json")).toBe("[]\n");
    expect(app("services/usage/package.json")).toBe(manifest("usage"));
    expect(existsSync(join(synced.root, "services/billing/src/modules/orders/__tests__"))).toBe(
      false,
    );
    expect(readlinkSync(join(synced.root, "services/billing/node_modules"))).toBe(
      join(repository, "services/billing/node_modules"),
    );
    expect(lstatSync(join(synced.root, "node_modules")).isSymbolicLink()).toBe(true);
  });

  it("writes only what changed and removes what is gone", () => {
    const request = { repository, members: members("billing", "usage") };
    expect(syncDevEncoreApp(request).written).toBeGreaterThan(10);
    expect(syncDevEncoreApp(request)).toMatchObject({ written: 0, removed: 0 });

    write("services/billing/src/modules/orders/index.ts", "export const orders = 2;\n");
    expect(syncDevEncoreMember(request, join(repository, "services/billing"))).toEqual({
      written: 1,
      removed: 0,
    });
    expect(app("services/billing/src/modules/orders/index.ts")).toBe("export const orders = 2;\n");

    rmSync(join(repository, "services/billing/assets/rows.json"));
    write("services/billing/stackra-encore/billing/encore.service.ts", "export default 1;\n");
    expect(syncDevEncoreMember(request, join(repository, "services/billing"))).toEqual({
      written: 1,
      removed: 1,
    });

    const dropped = syncDevEncoreApp({ repository, members: members("usage") });
    expect(dropped.removed).toBe(1);
    expect(existsSync(join(dropped.root, "services/billing"))).toBe(false);
    expect(existsSync(join(dropped.root, "services/usage/src/modules/orders/index.ts"))).toBe(true);
  });

  it("refuses two app ids, an unresolvable alias and no member", () => {
    write("services/usage/encore.app", '{ "id": "other", "lang": "typescript" }\n');
    expect(() => syncDevEncoreApp({ repository, members: members("billing", "usage") })).toThrow(
      RunwayInvalidError,
    );

    write("services/billing/src/modules/orders/index.ts", 'export * from "#modules/missing";\n');
    expect(() => syncDevEncoreApp({ repository, members: members("billing") })).toThrow(
      RunwayUnresolvedError,
    );
    expect(() => syncDevEncoreApp({ repository, members: [] })).toThrow(/at least one/);
  });
});
