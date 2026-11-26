/**
 * Stackra file contract:
 * Purpose: hold `ci-test-plan.mjs` to its contract (STA-2705): a pull request tests its affected members plus the
 *          core five, a markdown-only change only the members whose files it changed, any other event every member; the core five
 *          are real workspace members; the Quality Gate in `.github/workflows/ci.yml` runs the plan as a step; and the
 *          agent merge rule (flow.config.json `agentsMd`, rendered into AGENTS.md) lets only a markdown-only change, or
 *          an accepted `Known red:` line, merge past the gate with `--admin` (STA-2705 amending STA-2083).
 * Boundary: pure functions on injected data; the CLI runs with `--dry-run` in a throwaway git repository, so no test
 *           runs turbo. Reads ci.yml, flow.config.json, AGENTS.md and the members' package.json files.
 * Runtime: node
 * Governing contract: ADR 0022 (tests live in tests folders); ADR 0182 (testing strategy).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  ALWAYS_TESTED,
  EXCLUDED,
  formatPlan,
  isDocsOnly,
  parseArgs,
  testPlan,
} from "../ci-test-plan.mjs";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SCRIPT = fileURLToPath(new URL("../ci-test-plan.mjs", import.meta.url));

test("isDocsOnly: true only for a non-empty change of .md and .mdx files", () => {
  assert.equal(
    isDocsOnly(["README.md", "apps/docs/src/docs/adr/0001-x.mdx", ".changeset/a.MD"]),
    true,
  );
  assert.equal(isDocsOnly(["README.md", "packages/data/database/src/index.ts"]), false);
  assert.equal(isDocsOnly([".github/workflows/ci.yml"]), false);
  assert.equal(isDocsOnly(["docs.md.ts"]), false);
  assert.equal(isDocsOnly([]), false);
});

test("a code pull request tests the affected members plus the core five, never the Uniwind Pro apps", () => {
  const plan = testPlan({
    event: "pull_request",
    base: "HEAD~1",
    changedFiles: ["packages/foundation/errors/src/index.ts", "README.md"],
  });
  assert.equal(plan.scope, "affected+core");
  assert.deepEqual(plan.args, [
    "run",
    "test",
    "--filter=...[HEAD~1]",
    "--filter=@stackra/gen",
    "--filter=@stackra/tenancy",
    "--filter=@stackra/identity",
    "--filter=@stackra/actions",
    "--filter=@stackra/database",
    "--filter=!@figentra/mobile",
    "--filter=!@figentra/playground",
    "--continue=dependencies-successful",
    "--concurrency=2",
  ]);
});

test("an empty pull request diff still counts as code: the core five run", () => {
  const plan = testPlan({ event: "pull_request", base: "origin/main", changedFiles: [] });
  assert.equal(plan.scope, "affected+core");
  assert.ok(plan.args.includes("--filter=...[origin/main]"));
  for (const name of ALWAYS_TESTED) assert.ok(plan.args.includes(`--filter=${name}`), name);
});

test("a markdown-only pull request tests only the members it changed, no dependents (docs keep merge now)", () => {
  const plan = testPlan({
    event: "pull_request",
    base: "HEAD~1",
    changedFiles: ["AGENTS.md", "x/y.mdx"],
  });
  assert.equal(plan.scope, "changed");
  assert.ok(plan.args.includes("--filter=[HEAD~1]"));
  assert.ok(!plan.args.some((arg) => arg.startsWith("--filter=...")), "no dependents");
  for (const name of ALWAYS_TESTED) assert.ok(!plan.args.includes(`--filter=${name}`), name);
});

test("any other event (a manual run on main) tests every member but the Uniwind Pro apps", () => {
  const plan = testPlan({ event: "workflow_dispatch", base: "HEAD~1", changedFiles: ["a.ts"] });
  assert.equal(plan.scope, "all");
  assert.deepEqual(plan.args, [
    "run",
    "test",
    ...EXCLUDED.map((name) => `--filter=!${name}`),
    "--continue=dependencies-successful",
    "--concurrency=2",
  ]);
  assert.equal(testPlan({ event: "", base: "HEAD~1", changedFiles: [] }).scope, "all");
});

test("formatPlan quotes the filters a shell would expand", () => {
  const line = formatPlan(
    testPlan({ event: "pull_request", base: "HEAD~1", changedFiles: ["a.ts"] }),
  );
  assert.match(line, /^Tests \(affected\+core\): code change/);
  assert.match(
    line,
    /\$ pnpm exec turbo run test '--filter=\.\.\.\[HEAD~1\]' --filter=@stackra\/gen /,
  );
  assert.match(line, /'--filter=!@figentra\/mobile'/);
});

test("parseArgs: defaults from the environment, flags override, unknown or empty flags are errors", () => {
  assert.deepEqual(parseArgs([], { GITHUB_EVENT_NAME: "pull_request" }), {
    event: "pull_request",
    base: "HEAD~1",
    dryRun: false,
  });
  assert.deepEqual(parseArgs(["--event", "push", "--base", "main", "--dry-run"], {}), {
    event: "push",
    base: "main",
    dryRun: true,
  });
  assert.match(parseArgs(["--base"], {}).error, /--base needs a value/);
  assert.match(parseArgs(["--base", "--dry-run"], {}).error, /--base needs a value/);
  assert.match(parseArgs(["--affected"], {}).error, /unknown argument --affected/);
});

/** Every workspace package's name and scripts, read from packages/<category>/<name>/package.json. */
function workspacePackages() {
  const packages = new Map();
  const dir = join(ROOT, "packages");
  for (const category of readdirSync(dir, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const member of readdirSync(join(dir, category.name), { withFileTypes: true })) {
      const manifest = join(dir, category.name, member.name, "package.json");
      if (member.isDirectory() && existsSync(manifest)) {
        const { name, scripts = {} } = JSON.parse(readFileSync(manifest, "utf8"));
        packages.set(name, scripts);
      }
    }
  }
  return packages;
}

test("every always-tested member exists in the workspace and has a test script", () => {
  const packages = workspacePackages();
  for (const name of ALWAYS_TESTED) {
    assert.ok(packages.has(name), `${name} is not a workspace member`);
    assert.ok(packages.get(name).test, `${name} has no test script`);
  }
});

test("the Quality Gate runs the test plan as a step of the required job", () => {
  const workflow = parse(readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8"));
  const gate = workflow.jobs.gate;
  assert.equal(gate.name, "Quality Gate");
  const step = gate.steps.find((s) => s.name === "Test");
  assert.ok(step, "the Quality Gate has no Test step");
  assert.match(step.run, /^node tools\/scripts\/ci-test-plan\.mjs\b/m);
  assert.ok(!("if" in step), "the Test step must run on every gate event");
  assert.ok(!step["continue-on-error"], "a red test must fail the gate");
  assert.ok(Number(step["timeout-minutes"]) > 0, "the Test step needs a timeout");
});

/** The merge rule as flow.config.json states it: the "Tests run later" section of `facts` plus the `land` line. */
function mergeRule() {
  const { facts, land } = JSON.parse(readFileSync(join(ROOT, "flow.config.json"), "utf8")).agentsMd;
  const start = facts.indexOf("## Tests run later");
  assert.ok(start >= 0, 'flow.config.json facts lost the "Tests run later" section');
  const end = facts.indexOf("\n## ", start + 1);
  return { section: facts.slice(start, end < 0 ? undefined : end), land };
}

test("the merge rule lets only a markdown-only change or an accepted known red pass the gate with --admin", () => {
  const { section, land } = mergeRule();
  for (const text of [section, land]) {
    assert.doesNotMatch(text, /never wait on the gate|no waiting on CI|nothing waits on tests/i);
    // Every paragraph or bullet that sends a merge through --admin scopes it to docs or a named known red.
    for (const part of text.split(/\n(?=- )|\n\n/)) {
      if (/--admin\b/.test(part) && !/without `--admin`/.test(part))
        assert.match(part, /markdown-only|Known red:/, `an unscoped --admin merge: ${part}`);
    }
  }
  assert.match(section, /code change[^.]*merges only once the Quality Gate is green/);
  assert.match(land, /code change[^.]*once the Quality Gate is green/);
  assert.match(section, /STA-2705/);
});

test("AGENTS.md carries the merge rule exactly as flow.config.json states it (fflow sync ran)", () => {
  const { section, land } = mergeRule();
  const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8");
  assert.ok(agents.includes(section.trim()), "AGENTS.md is stale: run fflow sync");
  assert.ok(agents.includes(land), "AGENTS.md is stale: run fflow sync");
});

/** A throwaway git repository with one commit of `files` on top of an initial one. */
function repoWithChange(files) {
  const dir = mkdtempSync(join(tmpdir(), "ci-test-plan-"));
  const git = (...args) => {
    const r = spawnSync("git", ["-C", dir, "-c", "user.name=t", "-c", "user.email=t@t", ...args], {
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
  };
  git("init", "-q");
  writeFileSync(join(dir, "seed.txt"), "seed\n");
  git("add", ".");
  git("commit", "-q", "-m", "seed");
  for (const file of files) writeFileSync(join(dir, file), "x\n");
  git("add", ".");
  git("commit", "-q", "-m", "change");
  return dir;
}

function runDry(dir, ...args) {
  return spawnSync(process.execPath, [SCRIPT, "--dry-run", ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, GITHUB_EVENT_NAME: "pull_request" },
  });
}

test("CLI: reads the change from git and prints the plan without running turbo", () => {
  const code = runDry(repoWithChange(["service.ts"]));
  assert.equal(code.status, 0, code.stderr);
  assert.match(code.stdout, /Tests \(affected\+core\)/);
  assert.match(code.stdout, /--filter=@stackra\/database/);

  const docs = runDry(repoWithChange(["NOTES.md"]));
  assert.equal(docs.status, 0, docs.stderr);
  assert.match(docs.stdout, /Tests \(changed\): markdown-only change/);
});

test("CLI: exits 2 on a usage error or a base git cannot resolve", () => {
  const dir = repoWithChange(["a.ts"]);
  assert.equal(runDry(dir, "--nope").status, 2);
  const bad = runDry(dir, "--base", "no-such-ref");
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /git diff --name-only no-such-ref HEAD failed/);
});
