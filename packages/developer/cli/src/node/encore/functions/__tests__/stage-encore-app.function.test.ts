/**
 * Stackra file contract:
 * Purpose: unit tests of `stageEncoreApp`: two services and the workspace package they reach are copied under
 *          `.stackra/encore-app`, an unreached package is not; every copy's `#` imports are relative; the root holds
 *          the one `encore.app`, the pinned `encore.dev`, `paths` to the staged package source and its own
 *          pnpm-workspace.yaml; a copy's `node_modules` links to the member's; a member's `encore.app` is not copied;
 *          an unresolvable specifier is reported; two app ids, no generated service and no catalog pin are refused.
 * Boundary: test only; a throwaway repository in the OS temp folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0091 (amendment of 2026-11-09: option b).
 */
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, it } from "@stackra/testing";

import { ENCORE_STAGE } from "#node/encore/constants/encore-stage.constant";
import { stageEncoreApp } from "#node/encore/functions/stage-encore-app.function";

const APP = '{\n  "id": "acme-commerce-x1y2"\n}\n';
const IMPORTS = {
  "#modules/*": ["./src/modules/*", "./src/modules/*.ts"],
  "#core/*": ["./src/core/*", "./src/core/*.ts"],
};

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** Writes `text` at `path` below the repository, making its folders. */
function put(path: string, text: string): void {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

/** A repository with two services on one app, a package they use and one they do not. */
function repository(appOfBilling = APP): void {
  root = mkdtempSync(join(tmpdir(), "stackra-cli-stage-"));
  put("pnpm-workspace.yaml", "packages:\n  - services/*\ncatalog:\n  encore.dev: 1.58.8\n");
  for (const [name, app] of [
    ["orders", APP],
    ["billing", appOfBilling],
  ] as const) {
    put(
      `services/${name}/package.json`,
      JSON.stringify({
        name: `@acme/service-${name}`,
        imports: IMPORTS,
        dependencies: { "@acme/money": "workspace:*", zod: "catalog:" },
      }),
    );
    put(`services/${name}/encore.app`, app);
    put(
      `services/${name}/src/modules/${name}/actions/run.action.ts`,
      `import { round } from "@acme/money";\nimport { helper } from "#modules/${name}/services/helper";\nexport const run = () => round(helper());\n`,
    );
    put(
      `services/${name}/src/modules/${name}/services/helper.ts`,
      "export const helper = () => 1;\n",
    );
    put(`services/${name}/node_modules/zod/package.json`, "{}");
  }
  put(
    "packages/commerce/money/package.json",
    JSON.stringify({
      name: "@acme/money",
      imports: IMPORTS,
      exports: {
        ".": { "@stackra/source": "./src/core/index.ts", default: "./dist/index.mjs" },
        "./assets/*": "./assets/*",
      },
    }),
  );
  put("packages/commerce/money/src/core/index.ts", 'export { round } from "#core/round";\n');
  put("packages/commerce/money/src/core/round.ts", "export const round = (n: number) => n;\n");
  put("packages/commerce/money/dist/index.mjs", "export {};\n");
  put("packages/commerce/unused/package.json", JSON.stringify({ name: "@acme/unused" }));
}

const staged = (path: string) => readFileSync(join(root, ENCORE_STAGE, path), "utf8");

describe("stageEncoreApp", () => {
  it("stages the services and the packages they reach, with relative imports", () => {
    repository();
    const result = stageEncoreApp(root);
    expect(result).toMatchObject({
      services: ["services/billing", "services/orders"],
      packages: ["packages/commerce/money"],
      unresolved: [],
    });
    expect(result.rewritten).toBe(3);
    expect(staged("services/orders/src/modules/orders/actions/run.action.ts")).toBe(
      'import { round } from "@acme/money";\nimport { helper } from "../services/helper";\nexport const run = () => round(helper());\n',
    );
    expect(staged("packages/commerce/money/src/core/index.ts")).toBe(
      'export { round } from "./round";\n',
    );
    expect(existsSync(join(root, ENCORE_STAGE, "packages/commerce/unused"))).toBe(false);
    expect(existsSync(join(root, ENCORE_STAGE, "packages/commerce/money/dist"))).toBe(false);
    expect(existsSync(join(root, ENCORE_STAGE, "services/orders/encore.app"))).toBe(false);
    expect(
      lstatSync(join(root, ENCORE_STAGE, "services/orders/node_modules")).isSymbolicLink(),
    ).toBe(true);
    expect(existsSync(join(root, ENCORE_STAGE, "services/orders/node_modules/zod"))).toBe(true);
  });

  it("writes the app root: one encore.app, the pinned encore.dev, paths and its own workspace", () => {
    repository();
    stageEncoreApp(root);
    expect(staged("encore.app")).toBe(APP);
    expect(JSON.parse(staged("package.json"))).toMatchObject({
      private: true,
      dependencies: { "encore.dev": "1.58.8" },
    });
    expect(JSON.parse(staged("tsconfig.json"))).toEqual({
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@acme/money": ["./packages/commerce/money/src/core/index.ts"],
          "@acme/money/assets/*": ["./packages/commerce/money/assets/*"],
        },
      },
    });
    expect(staged("pnpm-workspace.yaml")).toBe("packages:\n  - .\n");
  });

  it("replaces the folder whole and reports an unresolvable # import", () => {
    repository();
    stageEncoreApp(root);
    put("services/orders/src/modules/orders/actions/stray.ts", 'import { x } from "#config/x";\n');
    put(`${ENCORE_STAGE}/left-over.txt`, "stale");
    const result = stageEncoreApp(root);
    expect(result.unresolved).toEqual([
      {
        file: "services/orders/src/modules/orders/actions/stray.ts",
        specifier: "#config/x",
      },
    ]);
    expect(existsSync(join(root, ENCORE_STAGE, "left-over.txt"))).toBe(false);
  });

  it("refuses two app ids, no generated service and no catalog pin", () => {
    repository('{\n  "id": "other-app"\n}\n');
    expect(() => stageEncoreApp(root)).toThrow("2 different Encore apps");
    rmSync(join(root, "services/billing/encore.app"));
    rmSync(join(root, "services/orders/encore.app"));
    expect(() => stageEncoreApp(root)).toThrow("run stackra gen");
    put("pnpm-workspace.yaml", "packages:\n  - services/*\n");
    expect(() => stageEncoreApp(root)).toThrow("no encore.dev");
  });
});
