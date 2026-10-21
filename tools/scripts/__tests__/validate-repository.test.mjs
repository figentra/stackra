import assert from "node:assert/strict";
import { test } from "node:test";

import {
  check,
  checkExports,
  checkFiles,
  checkJsonConfigs,
  checkService,
  checkTestPlacement,
  tierFor,
} from "../validate-repository.mjs";

const ok = {
  dir: "packages/foundation/container",
  pkg: { name: "@stackra/container", dependencies: { a: "catalog:", b: "workspace:*" } },
  turbo: { extends: ["//"], tags: ["tier:lib"] },
  tsconfig: { extends: "@stackra/typescript-config/library" },
};

test("a well-formed member has no findings", () => assert.deepEqual(check(ok), []));

test("a literal version is a finding; a peer range is not", () => {
  const f = check({
    ...ok,
    pkg: { ...ok.pkg, devDependencies: { x: "^1.0.0" }, peerDependencies: { react: ">=19" } },
  });
  assert.equal(f.length, 1);
  assert.match(f[0], /devDependencies\.x/);
});

test("forbidden dependency, wrong name, wrong tier, foreign tsconfig", () => {
  const f = check({
    dir: "apps/console",
    pkg: { name: "console", dependencies: { prisma: "catalog:" } },
    turbo: { extends: ["//"], tags: ["tier:lib"] },
    tsconfig: { extends: "../../tsconfig.base.json" },
  });
  assert.equal(f.length, 4);
});

test("dependencies replaced by Accepted ADRs are forbidden", () => {
  for (const dep of [
    "expo-router",
    "zustand",
    "@tanstack/store",
    "i18next",
    "react-i18next",
    "class-validator",
    "class-transformer",
    "meilisearch",
    "@opensearch-project/opensearch",
  ]) {
    const f = check({ ...ok, pkg: { ...ok.pkg, devDependencies: { [dep]: "catalog:" } } });
    assert.deepEqual(f, [`devDependencies.${dep} is a forbidden dependency`], dep);
  }
});

const named = (dir, name) =>
  check({ ...ok, dir, pkg: { name } }).filter((m) => /package name/.test(m));

test("names follow placement: packages @stackra, apps @figentra, services @figentra/service-", () => {
  assert.equal(named("apps/console", "@figentra/console").length, 0);
  assert.equal(named("services/health", "@figentra/service-health").length, 0);
  assert.equal(named("packages/tooling/vitest", "@stackra/vitest-config").length, 0);
  assert.equal(named("packages/data/search", "@stackra/search").length, 0);
  assert.equal(named("services/health", "@stackra/service-health").length, 1);
  assert.equal(named("apps/docs", "@stackra/docs").length, 1);
  assert.equal(named("packages/data/search", "@figentra/search").length, 1);
});

test("tiers follow the directory", () => {
  assert.equal(tierFor("apps/docs"), "tier:app");
  assert.equal(tierFor("packages/tooling/vitest"), "tier:config");
  assert.equal(tierFor("packages/data/search"), "tier:lib");
  assert.equal(tierFor(""), null);
});

const filesOk = {
  dir: "packages/data/search",
  pkg: {
    description: "x",
    license: "MIT",
    sideEffects: false,
    exports: {
      ".": {
        "@stackra/source": "./src/index.ts",
        types: "./dist/index.d.mts",
        default: "./dist/index.mjs",
      },
      "./c": "./c.json",
    },
  },
  files: ["README.md", "AGENTS.md", "CHANGELOG.md", "LICENSE"],
  agents: "# A\n\n## PII\n",
  licenseText: "L",
  rootLicense: "L",
};

test("a complete member has no file findings", () => assert.deepEqual(checkFiles(filesOk), []));

test("missing files, PII, license drift, manifest hygiene", () => {
  const f = checkFiles({
    ...filesOk,
    files: ["README.md", "AGENTS.md", "LICENSE"],
    agents: "# A",
    licenseText: "other",
    pkg: { description: " ", license: "UNLICENSED", exports: { ".": "./dist/index.js" } },
  });
  assert.equal(f.length, 7);
});

test("apps and services are UNLICENSED with no LICENSE file (ADR 0195)", () => {
  const app = { dir: "apps/console", pkg: { description: "x", license: "UNLICENSED" } };
  assert.deepEqual(
    checkFiles({ ...filesOk, ...app, files: ["README.md", "AGENTS.md", "CHANGELOG.md"] }),
    [],
  );
  assert.equal(checkFiles({ ...filesOk, ...app }).length, 1);
  assert.equal(
    checkFiles({
      ...filesOk,
      dir: "services/health",
      files: ["README.md", "AGENTS.md", "CHANGELOG.md"],
    }).length,
    1,
  );
});

test("sideEffects and exports rules apply to tier:lib only", () => {
  const pkg = { description: "x", license: "MIT", exports: "./dist/a.js" };
  assert.deepEqual(
    checkFiles({
      ...filesOk,
      dir: "apps/console",
      pkg: { ...pkg, license: "UNLICENSED" },
      files: ["README.md", "AGENTS.md", "CHANGELOG.md"],
    }),
    [],
  );
  assert.deepEqual(checkFiles({ ...filesOk, dir: "packages/tooling/vitest", pkg }), []);
});

test("checkExports: ADR 0025 dist shape with @stackra/source first; strings are static assets", () => {
  const good = {
    "@stackra/source": "./src/a/index.ts",
    types: "./dist/a.d.mts",
    default: "./dist/a.mjs",
  };
  assert.deepEqual(
    checkExports({ "./a": good, "./tokens.css": "./src/t.css", "./resources/*": "./resources/*" }),
    [],
  );
  assert.equal(checkExports({ ".": { types: "./dist/a.d.mts", ...good } }).length, 1);
  assert.equal(checkExports({ ".": { types: "./src/a.ts", default: "./src/a.ts" } }).length, 3);
  assert.equal(checkExports({ ".": "./src/index.ts" }).length, 1);
  assert.equal(checkExports("./dist/index.mjs").length, 1);
  assert.deepEqual(checkExports(undefined), []);
});

test("services: main entry, stackra.module that exists, no Encore files (ADR 0126)", () => {
  const pkg = { stackra: { module: "./src/notes.module.ts" } };
  assert.deepEqual(checkService({ pkg, paths: ["src/main.ts", "src/notes.module.ts"] }), []);
  assert.deepEqual(checkService({ pkg: {}, paths: ["src/encore.service.ts"] }), [
    "src/main.ts missing",
    'package.json has no "stackra": { "module": "./src/<name>.module.ts" } (ADR 0090)',
    "src/encore.service.ts: services hold no Encore files; stackra gen generates them (ADR 0124)",
  ]);
  assert.deepEqual(checkService({ pkg, paths: ["src/main.ts"] }), [
    "package.json stackra.module ./src/notes.module.ts does not exist",
  ]);
});

test("checkTestPlacement: test files must sit directly in __tests__/", () => {
  assert.deepEqual(
    checkTestPlacement([
      "packages/a/b/src/__tests__/x.test.ts",
      "apps/web/src/app/__tests__/page.test.tsx",
      ".agents/hooks/__tests__/guard.test.mjs",
      "packages/a/b/src/__tests__/fixture.ts",
      ".old/console.old/src/app.test.ts",
    ]),
    [],
  );
  assert.deepEqual(checkTestPlacement(["packages/a/b/src/x.test.ts", "tools/scripts/y.test.mjs"]), [
    "packages/a/b/src/x.test.ts: test files go in a __tests__/ folder (ADR 0022)",
    "tools/scripts/y.test.mjs: test files go in a __tests__/ folder (ADR 0022)",
  ]);
  assert.deepEqual(checkTestPlacement(["src/__tests__/deep/x.test.ts"]), [
    "src/__tests__/deep/x.test.ts: test files go in a __tests__/ folder (ADR 0022)",
  ]);
  assert.deepEqual(checkTestPlacement(["src/__tests__/x.spec.ts"]), [
    "src/__tests__/x.spec.ts: name it <subject>.test.<ext>, not .spec (ADR 0022)",
  ]);
  assert.deepEqual(
    checkTestPlacement(["src/__tests__/x.int.test.ts", "src/__tests__/x.e2e.test.ts"]),
    [],
  );
  assert.deepEqual(checkTestPlacement(["src/x/x.stories.tsx"]), [
    "src/x/x.stories.tsx: no Storybook; test the component in __tests__/",
  ]);
});

test("checkJsonConfigs: a JSONC-capable *.json config is a finding; MUST_STAY_JSON paths are not", () => {
  assert.deepEqual(
    checkJsonConfigs([
      "package.json",
      "apps/console/package.json",
      "apps/console/tsconfig.json",
      "packages/tooling/typescript/src/node.json",
      "apps/mobile/app.json",
      "apps/mobile/eas.json",
      "apps/docs/src/docs.json",
      ".claude/settings.json",
      ".mcp.json",
      ".changeset/config.json",
      ".specify/integration.json",
      ".agents/skills/x/scripts/package.json",
      "apps/console/turbo.jsonc",
      ".oxlintrc.jsonc",
      "README.md",
    ]),
    [],
  );
  const flagged = ["apps/console/turbo.json", ".oxfmtrc.json", "knip.json", ".agents/models.json"];
  assert.deepEqual(
    checkJsonConfigs(flagged).map((m) => m.split(":")[0]),
    flagged,
  );
  const yamlOwed = [".agents/models.jsonc", ".mcp.jsonc", "tools/x/config.jsonc"];
  assert.deepEqual(
    checkJsonConfigs([...yamlOwed, "knip.jsonc", "opencode.jsonc", ".oxfmtrc.jsonc"]).map(
      (m) => m.split(":")[0],
    ),
    yamlOwed,
  );
});
