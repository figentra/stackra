/**
 * Stackra file contract:
 * Purpose: tests of the plan gate (ADR 0362): a Write or Edit to a source path needs the branch's spec answered and a
 *          plan, or the owner's hotfix marker.
 * Boundary: test only; temp repos, no network.
 * Runtime: node (node:test)
 * Governing contract: ADR 0362; ADR 0022 (test placement).
 */
// @covers sta-614:FR-001 sta-614:FR-002 sta-614:FR-003 sta-614:FR-004
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decidePlanGate, decideWrite, hotfixApproved } from "../_rules.mjs";

const IMPACT = [
  "Apps touched",
  "Services touched",
  "Packages touched",
  "Cross-service events",
  "Tenancy and data",
  "Secrets",
  "ADR needed",
  "New dependencies",
  "Deploy modes",
  "Licence tier",
  "Docs to update",
  "Lane",
  "Change risk",
];
const SPEC = [
  "**Status**: Clarified",
  "**Linear**: STA-7",
  "**Clarifications status**: complete",
  "",
  "## Impact",
  "",
  ...IMPACT.map((f) => `- **${f}**: none`),
  "",
].join("\n");
const HOTFIX = "**Approved by**: owner\n**Approved on**: 2026-10-25\n**Reason**: checkout down\n";

/** A repository root with `.agents/specs/<folder>/` holding `files`. */
function repo(folder, files = {}) {
  const root = mkdtempSync(join(tmpdir(), "plan-gate-"));
  if (folder) {
    const dir = join(root, ".agents/specs", folder);
    mkdirSync(dir, { recursive: true });
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  }
  return root;
}
const decide = (root, rel, branch = "figentra/sta-7-thing") =>
  decidePlanGate(join(root, rel), { root, branch }).then((d) => d.decision);

test("allow: a source path with an answered spec and a plan", async () => {
  const root = repo("sta-7-thing", { "spec.md": SPEC, "plan.md": "# Plan\n" });
  for (const rel of [
    "packages/data/x/src/a.ts",
    "services/billing/src/main.ts",
    "apps/console/src/x.tsx",
    "workers/static/src/main.ts",
    "tools/scripts/x.mjs",
  ])
    assert.equal(await decide(root, rel), "allow", rel);
});

test("allow: paths outside source need no spec", async () => {
  const root = repo(null);
  for (const rel of [
    ".agents/specs/sta-7-thing/spec.md",
    "apps/docs/src/docs/adr/0362-x.mdx",
    "tools/scaffold/templates/apps/docs/index.mdx",
    "README.md",
    ".agents/hooks/_rules.mjs",
    "notes/handover/x.md",
    "packages/a/README.md",
    "services/a/docs/guide.mdx",
  ])
    assert.equal(await decide(root, rel, "main"), "allow", rel);
});

test("deny: a source path on a branch with no STA key", async () => {
  const root = repo("sta-7-thing", { "spec.md": SPEC, "plan.md": "# Plan\n" });
  assert.equal(await decide(root, "packages/a/src/a.ts", "main"), "deny");
  assert.equal(await decide(root, "packages/a/src/a.ts", ""), "deny");
});

test("deny: no spec folder, two spec folders, or no spec.md", async () => {
  assert.equal(await decide(repo(null), "packages/a/src/a.ts"), "deny");
  const two = repo("sta-7-thing", { "spec.md": SPEC, "plan.md": "x" });
  mkdirSync(join(two, ".agents/specs/sta-7-other"));
  assert.equal(await decide(two, "packages/a/src/a.ts"), "deny");
  assert.equal(await decide(repo("sta-7-thing", { "plan.md": "x" }), "apps/x/a.ts"), "deny");
});

test("deny: a spec with an unanswered question", async () => {
  for (const spec of [
    SPEC.replace("complete", "pending"),
    SPEC.replace("- **Lane**: none", "- **Lane**:"),
    `${SPEC}\n[NEEDS CLARIFICATION: which region?]\n`,
  ]) {
    const root = repo("sta-7-thing", { "spec.md": spec, "plan.md": "# Plan\n" });
    assert.equal(await decide(root, "services/a/src/a.ts"), "deny");
  }
});

test("deny: an answered spec without a plan", async () => {
  assert.equal(await decide(repo("sta-7-thing", { "spec.md": SPEC }), "workers/a/x.ts"), "deny");
  const blank = repo("sta-7-thing", { "spec.md": SPEC, "plan.md": "  \n" });
  assert.equal(await decide(blank, "workers/a/x.ts"), "deny");
});

test("allow: an owner-approved hotfix goes before its questionnaire", async () => {
  assert.equal(
    await decide(repo("sta-7-thing", { "hotfix.md": HOTFIX }), "services/a/x.ts"),
    "allow",
  );
  const half = repo("sta-7-thing", { "hotfix.md": "**Approved by**: owner\n**Reason**:\n" });
  assert.equal(await decide(half, "services/a/x.ts"), "deny");
  assert.equal(hotfixApproved(HOTFIX), true);
  assert.equal(hotfixApproved(""), false);
  assert.equal(hotfixApproved(HOTFIX.replace("2026-10-25", "soon")), false);
});

test("deny: an agent never writes the hotfix marker", () => {
  assert.equal(decideWrite("/r/.agents/specs/sta-7-thing/hotfix.md").decision, "deny");
  assert.equal(decideWrite("/r/.agents/specs/sta-7-thing/spec.md").decision, "allow");
});

test("hook: reads the branch from the file's git checkout; outside git it allows", () => {
  const hook = new URL("../guard-paths.mjs", import.meta.url).pathname;
  const root = repo(null);
  spawnSync("git", ["init", "-q", "-b", "figentra/sta-7-thing", root]);
  const run = (file_path) =>
    spawnSync("node", [hook], {
      input: JSON.stringify({ tool_name: "Write", tool_input: { file_path, content: "x" } }),
      encoding: "utf8",
    }).stdout.includes('"permissionDecision":"deny"');
  assert.equal(run(join(root, "packages/a/src/new/a.ts")), true); // no spec yet; the folder need not exist
  assert.equal(run(join(root, "apps/docs/src/a.mdx")), false);
  const dir = join(root, ".agents/specs/sta-7-thing");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "spec.md"), SPEC);
  writeFileSync(join(dir, "plan.md"), "# Plan\n");
  assert.equal(run(join(root, "packages/a/src/new/a.ts")), false);
  assert.equal(run(join(repo(null), "packages/a/src/a.ts")), false); // not a git checkout
});

test("hook: a rebase leaves HEAD detached, and the gate still reads the branch", () => {
  const root = repo(null);
  const git = (...a) => spawnSync("git", ["-C", root, ...a], { encoding: "utf8" });
  git("init", "-q", "-b", "figentra/sta-7-thing");
  const gitDir = join(root, ".git/rebase-merge");
  mkdirSync(gitDir, { recursive: true });
  writeFileSync(join(gitDir, "head-name"), "refs/heads/figentra/sta-7-thing\n");
  git("checkout", "-q", "--detach");
  const hook = new URL("../guard-paths.mjs", import.meta.url).pathname;
  const dir = join(root, ".agents/specs/sta-7-thing");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "spec.md"), SPEC);
  writeFileSync(join(dir, "plan.md"), "# Plan\n");
  const out = spawnSync("node", [hook], {
    input: JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: join(root, "packages/a/a.ts"), content: "x" },
    }),
    encoding: "utf8",
  }).stdout;
  assert.equal(out.includes('"permissionDecision":"deny"'), false);
});
