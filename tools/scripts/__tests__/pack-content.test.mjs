/**
 * Stackra file contract:
 * Purpose: hold `pack-content.mjs` to its contract: which paths are tests, which strings are secret-shaped (each rule
 *          matches a credential's full shape and not a pattern that only describes one, nor a binary file), and that
 *          `packCandidates` lists every file a `files` list packs (folders, globs, the always-packed files) minus
 *          the excluded tests, and nothing from `node_modules` (STA-2917).
 * Boundary: writes throwaway member folders under the OS temp directory and removes them. The secret-shaped samples
 *           are joined at run time, so this file holds none.
 * Runtime: node
 * Governing contract: ADR 0177 (PK4 release checks); ADR 0022 (tests live in tests folders); STA-2917.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import {
  isTestPath,
  globPattern,
  packCandidates,
  packFindings,
  SECRET_RULES,
  secretFindings,
  TEST_EXCLUDES,
} from "../pack-content.mjs";

/** `count` copies of `char`, so no sample below is written out in full. */
const run = (char, count) => char.repeat(count);

/** One real-shaped sample per rule, joined at run time. */
const SAMPLES = {
  "private-key": ["-----BEGIN RSA", "PRIVATE KEY-----"].join(" "),
  jwt: ["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiJ0ZXN0LXVzZXIifQ", "c2lnbmF0dXJlLWJ5dGVz"].join("."),
  "stripe-key": ["sk", "live", run("a1B2", 6)].join("_"),
  "aws-access-key": ["AKIA", run("Q7", 8)].join(""),
  "github-token": ["ghp", run("x9Y8", 9)].join("_"),
  "gitlab-token": ["glpat", run("Ab3", 7)].join("-"),
  "npm-token": ["npm", run("Z1y2", 9)].join("_"),
  "slack-token": ["xoxb", "123456789012", "abcdefghij"].join("-"),
  "slack-webhook": ["hooks.slack.com/services", "T0123ABCD", "B0123ABCD", run("aB3", 8)].join("/"),
  "google-api-key": ["AIza", run("Sy", 17), "X"].join(""),
  "sendgrid-key": ["SG", run("a", 22), run("b", 43)].join("."),
  "anthropic-key": ["sk", "ant", "api03", run("k9", 20)].join("-"),
  "openai-key": ["sk-proj-", run("q", 24), "T3Blbk", "FJ", run("r", 24)].join(""),
};

test("isTestPath: test folders and test file names at any depth, and nothing else", () => {
  for (const path of [
    "src/core/__tests__/a.test.ts",
    "src/__tests__/helpers.ts",
    "src/core/drivers/__tests__/__fixtures__/units.ts",
    "src/__fixtures__/a.json",
    "src/__snapshots__/a.snap",
    "src/__mocks__/fs.ts",
    "src/a.test.ts",
    "src/a.spec.mjs",
    "src/a.test-d.ts",
    "src/a.bench.ts",
    "a.test.tsx",
  ])
    assert.equal(isTestPath(path), true, path);
  for (const path of [
    "src/e2e/test/test.constant.ts",
    "src/testing/index.ts",
    "src/testing/fixtures/user.ts",
    "dist/testing.mjs",
    "src/latest.ts",
    "src/tests.ts",
    "src/attest.function.ts",
    "README.md",
  ])
    assert.equal(isTestPath(path), false, path);
});

test("every exclusion the hook adds matches a path isTestPath calls a test", () => {
  const examples = {
    "!**/__tests__": "src/__tests__/a.ts",
    "!**/__fixtures__": "src/__fixtures__/a.ts",
    "!**/__snapshots__": "src/__snapshots__/a.snap",
    "!**/__mocks__": "src/__mocks__/a.ts",
    "!**/*.test.*": "src/a.test.ts",
    "!**/*.spec.*": "src/a.spec.ts",
    "!**/*.test-d.*": "src/a.test-d.ts",
    "!**/*.bench.*": "src/a.bench.ts",
  };
  assert.deepEqual(Object.keys(examples), [...TEST_EXCLUDES]);
  for (const path of Object.values(examples)) assert.equal(isTestPath(path), true, path);
});

test("secretFindings: each rule matches its real-shaped sample and names line and kind", () => {
  assert.deepEqual(Object.keys(SAMPLES).sort(), SECRET_RULES.map(({ id }) => id).sort());
  for (const [rule, sample] of Object.entries(SAMPLES)) {
    const findings = secretFindings(Buffer.from(`first line\nconst value = "${sample}";\n`));
    assert.deepEqual(
      findings.map(({ line, rule: id }) => ({ line, id })),
      [{ line: 2, id: rule }],
      rule,
    );
    assert.ok(findings[0].what.length > 0);
  }
});

test("secretFindings: patterns that describe a secret, short stand-ins and binary files are not findings", () => {
  for (const text of [
    "const STRIPE = /sk_live_[0-9a-zA-Z]{24}/;",
    'const AWS = "AKIA[0-9A-Z]{16}";',
    'if (header.startsWith("-----BEGIN ")) parse(header);',
    'const prefix = "whsec_";',
    "const sample = 'sk_live_xxx';",
    "const head = 'eyJhbGciOiJIUzI1NiJ9';", // a JWT header alone
    "const kind = 'ghp_';",
  ])
    assert.deepEqual(secretFindings(Buffer.from(text)), [], text);
  const binary = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0]),
    Buffer.from(SAMPLES.jwt),
  ]);
  assert.deepEqual(secretFindings(binary), []);
});

/** A throwaway member folder holding `files` (relative path → content). */
function memberWith(files) {
  const dir = mkdtempSync(join(tmpdir(), "pack-content-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

test("packCandidates: folders, globs and the always-packed files, minus excluded tests and node_modules", () => {
  const dir = memberWith({
    "package.json": "{}",
    "README.md": "x",
    LICENSE: "x",
    "CHANGELOG.md": "x",
    "dist/index.mjs": "x",
    "dist/nested/a.mjs": "x",
    "src/a.ts": "x",
    "src/__tests__/a.test.ts": "x",
    "src/b.test.ts": "x",
    "src/config.json": "x",
    "src/deep/config.json": "x",
    "src/plugins/one.mjs": "x",
    "src/plugins/one.ts": "x",
    "app.plugin.js": "x",
    "notes.md": "x",
    "node_modules/dep/index.js": "x",
  });
  try {
    const files = ["dist/", "./app.plugin.js", "src/*.json", "src/plugins/*.mjs", ...TEST_EXCLUDES];
    assert.deepEqual(packCandidates({ files }, dir).sort(), [
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "app.plugin.js",
      "dist/index.mjs",
      "dist/nested/a.mjs",
      "package.json",
      "src/config.json",
      "src/plugins/one.mjs",
    ]);
    assert.deepEqual(packCandidates({ files: ["src"] }, dir).sort(), [
      "CHANGELOG.md",
      "LICENSE",
      "README.md",
      "package.json",
      "src/__tests__/a.test.ts", // without the exclusions the tests are packed, so they are candidates
      "src/a.ts",
      "src/b.test.ts",
      "src/config.json",
      "src/deep/config.json",
      "src/plugins/one.mjs",
      "src/plugins/one.ts",
    ]);
    assert.ok(!packCandidates({}, dir).some((path) => path.startsWith("node_modules/")));
    assert.ok(packCandidates({}, dir).includes("notes.md")); // no files list: everything
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("globPattern: a `**/` matches no folder as well as any number of them (a secret guard must not fail open)", () => {
  const mjs = globPattern("dist/**/*.mjs");
  for (const path of ["dist/index.mjs", "dist/a/index.mjs", "dist/a/b/c.mjs"])
    assert.ok(mjs.test(path), path);
  for (const path of [
    "dist/index.js",
    "distx/index.mjs",
    "src/dist/index.mjs",
    "dist/a/index.mjs.map",
  ])
    assert.ok(!mjs.test(path), path);
  assert.ok(globPattern("**/README.md").test("README.md"));
  assert.ok(globPattern("**/README.md").test("docs/README.md"));
  assert.ok(globPattern("dist/**").test("dist/a/b.mjs"));
  assert.ok(
    globPattern("src/*.ts").test("src/a.ts") && !globPattern("src/*.ts").test("src/a/b.ts"),
  );
  assert.ok(globPattern("a?.md").test("ab.md") && !globPattern("a?.md").test("a/.md"));
});

test("packCandidates: a `dist/**/*.mjs` files entry packs the top-level dist file too", () => {
  const dir = mkdtempSync(join(tmpdir(), "pack-content-glob-"));
  try {
    for (const path of ["dist/index.mjs", "dist/a/b.mjs", "dist/a/b.js"]) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), "export {};\n");
    }
    assert.deepEqual(packCandidates({ files: ["dist/**/*.mjs"] }, dir).sort(), [
      "dist/a/b.mjs",
      "dist/index.mjs",
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("packFindings: a test file without the exclusions and a shipped secret-shaped string; empty files skipped", () => {
  const dir = memberWith({
    "dist/index.mjs": `export {};\n// ${SAMPLES["aws-access-key"]}\n`,
    "dist/empty.mjs": "",
    "src/__tests__/a.test.ts": "x",
  });
  try {
    assert.deepEqual(packFindings({ files: ["dist", "src"] }, dir), [
      "dist/index.mjs:2: an AWS access key id (aws-access-key)",
      "src/__tests__/a.test.ts:0: a test file",
    ]);
    assert.ok(
      packFindings({}, dir).includes(
        "src/__tests__/a.test.ts:0: a test file (add a `files` list to package.json)",
      ),
    );
    assert.deepEqual(packFindings({ files: ["src", ...TEST_EXCLUDES] }, dir), []);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
