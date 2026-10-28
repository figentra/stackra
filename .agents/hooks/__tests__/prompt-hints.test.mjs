/**
 * Stackra file contract:
 * Purpose: hold `prompt-hints.mjs` to its contract: the hint each prompt pattern adds.
 * Boundary: test only; runs the hook as a child process on fixture payloads and temporary directories.
 * Runtime: node (node:test)
 * Governing contract: ADR 0016; ADR 0022 (tests live in tests folders).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const hook = new URL("../prompt-hints.mjs", import.meta.url).pathname;

/** Run the hook with a prompt; return the additionalContext text ("" when none was emitted). */
const hintsFor = (prompt) => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ prompt }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  const out = r.stdout.trim();
  if (!out) return "";
  const payload = JSON.parse(out);
  return payload.hookSpecificOutput?.additionalContext ?? "";
};

const cases = [
  // [prompt fragment, expected hint marker]
  ["add an endpoint for users", "http-conventions.md"],
  ["create a new route handler", "http-conventions.md"],
  ["where do I put this api key", ".agents/rules/secrets.md"],
  ["load the token from .env", ".agents/rules/secrets.md"],
  ["write an adr for this decision", "docs-adr-steward"],
  ["supersede ADR-0005", "docs-adr-steward"],
  ["add a changeset for the release", "runbooks/release.mdx"],
  ["should the changelog mention this", "runbooks/release.mdx"],
  ["write a vitest for this", "__tests__/"],
  ["where does the spec file go", "__tests__/"],
  ["bump the dependency version in package.json", "catalog"],
  ["create a new encore service for billing", "services/"],
  ["is this gateway a separate worker", "not-built-yet.md"],
  ["build a new button component", "@stackra/ui"],
  ["which design token is the brand colour", "@stackra/tokens"],
  ["add a drizzle migration", "MikroORM"],
  ["can we use prisma here", "MikroORM"],
  ["where should this new package live", "workspace-layout.md"],
  ["can a package import from another package's src", "turbo boundaries"],
  ["I want to add support for CSV export", "/speckit.clarify"],
  ["implement the invite flow", "/speckit.clarify"],
];

for (const [prompt, marker] of cases)
  test(`hint: "${prompt}" → contains "${marker}"`, () => {
    const ctx = hintsFor(prompt);
    assert.ok(ctx.startsWith("[STACKRA HINTS]"), `expected a hints block, got: ${ctx || "(none)"}`);
    assert.ok(ctx.includes(marker), `expected hint to mention ${marker}, got: ${ctx}`);
  });

const silent = [
  "hello",
  "fix the typo in the readme",
  "what does this function do",
  "refactor the loop",
];

for (const prompt of silent)
  test(`silent: "${prompt}" → no output`, () => assert.equal(hintsFor(prompt), ""));

test("accepts user_input as an alternate field", () => {
  const r = spawnSync("node", [hook], {
    input: JSON.stringify({ user_input: "add an endpoint" }),
    encoding: "utf8",
  });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes("http-conventions.md"));
});

test("malformed stdin exits 0 with no output (fail-open)", () => {
  const r = spawnSync("node", [hook], { input: "not json{", encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "");
});

test("empty prompt produces no output", () => {
  const r = spawnSync("node", [hook], { input: "{}", encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), "");
});

test("the word spec alone does not fire the no-.spec test hint", () => {
  assert.ok(!hintsFor("update the spec for contracts").includes("__tests__/"));
});

test("a /speckit command is not nudged back to clarify", () => {
  assert.ok(!hintsFor("/speckit.plan implement the invite flow").includes("/speckit.clarify"));
});
