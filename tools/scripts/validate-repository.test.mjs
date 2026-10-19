import assert from "node:assert/strict";
import { test } from "node:test";

import { check, checkFiles, checkServiceUnit, tierFor } from "./validate-repository.mjs";

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
    license: "UNLICENSED",
    sideEffects: false,
    exports: { ".": { types: "./src/index.ts", default: "./src/index.ts" }, "./c": "./c.json" },
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
    pkg: { description: " ", license: "MIT", exports: { ".": "./dist/index.js" } },
  });
  assert.equal(f.length, 7);
});

test("sideEffects and exports rules apply to tier:lib only", () => {
  const pkg = { description: "x", license: "UNLICENSED", exports: "./dist/a.js" };
  assert.deepEqual(checkFiles({ ...filesOk, dir: "apps/console", pkg }), []);
  assert.deepEqual(checkFiles({ ...filesOk, dir: "packages/tooling/vitest", pkg }), []);
});

test("service units need encore.service.ts, README, AGENTS with PII", () => {
  assert.deepEqual(
    checkServiceUnit({ files: ["encore.service.ts", "README.md", "AGENTS.md"], agents: "## PII" }),
    [],
  );
  assert.equal(checkServiceUnit({ files: ["api.ts"], agents: undefined }).length, 3);
});
