/**
 * Stackra file contract:
 * Purpose: hold the box's verify to ADR 0182: `pnpm verify:box` runs the repo gate, then the integration tier, then the
 *          coverage floors, each only after the one before passes; `pnpm test:coverage` covers packages and services;
 *          the testbed fallback's `verify` preset runs `pnpm verify:box`; and every package or service with a unit tier
 *          (a `test` script) is in the coverage gate (a `test:coverage` script), except the tooling presets, which
 *          configure the gate rather than ship runtime code (ADR 0300).
 * Boundary: reads package.json files and the workflow as text; runs no test, turbo or workflow.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 1: tiers; decision 2: coverage floors); ADR 0484 (decision 11: the testbed
 *                     fallback's presets); STA-229.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The tooling presets: they configure the gate (ADR 0300), so their own tests are not measured against it. */
const NOT_GATED = new Set([
  "@stackra/commitlint-config",
  "@stackra/oxlint-config",
  "@stackra/tsdown-config",
  "@stackra/typescript-config",
  "@stackra/vitest-config",
]);

/** The parsed package.json at `path`. */
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

/** The folders directly under `dir` (none when it does not exist). */
const folders = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(dir, entry.name))
    : [];

/** Every package (`packages/<category>/<name>`) and service (`services/<name>`) root with a package.json. */
const members = () =>
  [...folders("packages").flatMap(folders), ...folders("services")].filter((root) =>
    existsSync(join(root, "package.json")),
  );

test("verify:box runs the gate, then test:int, then the coverage floors, stopping at the first failure", () => {
  const { scripts } = readJson("package.json");
  assert.equal(scripts["verify:box"], "pnpm verify && pnpm test:int && pnpm test:coverage");
  assert.equal(scripts["test:int"], "turbo run test:int");
});

test("test:coverage covers the packages and the services", () => {
  const { scripts } = readJson("package.json");
  assert.match(scripts["test:coverage"], /^turbo run test:coverage /);
  assert.ok(
    scripts["test:coverage"].includes("--filter='./packages/**'"),
    "packages are not covered",
  );
  assert.ok(
    scripts["test:coverage"].includes("--filter='./services/**'"),
    "services are not covered",
  );
});

test("the testbed fallback's verify preset runs pnpm verify:box", () => {
  const workflow = readFileSync(".github/workflows/testbed-fallback.yml", "utf8");
  const step = workflow.slice(
    workflow.indexOf("- name: Verify"),
    workflow.indexOf("- name: Integration tests"),
  );
  assert.match(step, /if: inputs\.preset == 'verify'/);
  assert.match(step, /run: pnpm verify:box\s*$/);
});

test("every package or service with a unit tier is in the coverage gate", () => {
  const roots = members();
  assert.ok(roots.length > 50, `found only ${roots.length} members`);
  const outside = roots
    .map((root) => ({ root, manifest: readJson(join(root, "package.json")) }))
    .filter(({ manifest }) => manifest.scripts?.test !== undefined && !NOT_GATED.has(manifest.name))
    .filter(({ manifest }) => manifest.scripts["test:coverage"] === undefined)
    .map(({ root }) => root);
  assert.deepEqual(
    outside,
    [],
    "add a test:coverage script (vitest run --coverage, or stackra test --coverage)",
  );
});
