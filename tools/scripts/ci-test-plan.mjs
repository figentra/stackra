#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the Quality Gate's Test step (`node tools/scripts/ci-test-plan.mjs`): picks which members' unit tests
 *          (`turbo run test`) a change runs, then runs them. On a pull request: the members the change affects
 *          (`...[base]`, turbo's `--affected`) plus the core members in ALWAYS_TESTED, which every code change runs
 *          (owner decision 2026-11-20, STA-2705); a change of markdown only (`*.md`, `*.mdx`) runs only the members
 *          whose files it changed (`[base]`, no dependents, no core five), so docs keep "merge now": a README edit
 *          in @stackra/tenancy would otherwise test its 57 dependents too (17 min on 4 CPUs). Any other event (a manual
 *          run on main): every member.
 * Boundary: reads `git diff --name-only <base> HEAD`; runs `pnpm exec turbo run test` with the plan's filters. Writes
 *           nothing itself. Never runs `test:int` or `test:e2e` (they need Docker or a browser; the testbed runs them).
 * Runtime: node
 * Governing contract: ADR 0182 (testing strategy: the unit tier); ADR 0166 (the Quality Gate is the required check);
 *                     STA-2705 (amends STA-2083's "CI runs no tests" for code changes).
 * Usage: ci-test-plan.mjs [--event pull_request|<other>] [--base <ref>] [--dry-run]
 *        `--event` defaults to GITHUB_EVENT_NAME, `--base` to HEAD~1 (a pull request checks out its merge into main,
 *        so HEAD~1 is main and the diff is the pull request's own). `--dry-run` prints the command and runs nothing.
 * Exit: turbo's exit code (1 when any test fails); 2 on a usage error or when git cannot list the change.
 * Pure functions (isDocsOnly, testPlan, formatPlan) take injected data; only `main` shells out.
 * Secrets: forbidden — reads file names and exit codes only.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** The members every code change tests, whatever it touches: the generator, and the tenancy, identity, actions and
 *  database cores every service stands on (STA-2705). */
export const ALWAYS_TESTED = Object.freeze([
  "@stackra/gen",
  "@stackra/tenancy",
  "@stackra/identity",
  "@stackra/actions",
  "@stackra/database",
]);

/** Members the gate never installs: they alias Uniwind Pro, whose licensed build the Mobile apps job fetches. */
export const EXCLUDED = Object.freeze(["@figentra/mobile", "@figentra/playground"]);

/** Two turbo tasks at a time, as Typecheck: turbo's default of ten ran the hosted runner out of memory. */
export const CONCURRENCY = 2;

const DOCS_FILE = /\.mdx?$/i;

/** True when the change has files and every one is markdown (`*.md` or `*.mdx`). */
export function isDocsOnly(changedFiles) {
  return changedFiles.length > 0 && changedFiles.every((file) => DOCS_FILE.test(file));
}

/**
 * The test run for one gate event.
 * @param {{ event: string, base: string, changedFiles: readonly string[] }} input
 * @returns {{ scope: "all" | "changed" | "affected+core", reason: string, args: string[] }}
 */
export function testPlan({ event, base, changedFiles }) {
  const tail = [
    ...EXCLUDED.map((name) => `--filter=!${name}`),
    "--continue=dependencies-successful",
    `--concurrency=${CONCURRENCY}`,
  ];
  if (event !== "pull_request") {
    return {
      scope: "all",
      reason: `event ${event || "(none)"}: every member's tests`,
      args: ["run", "test", ...tail],
    };
  }
  if (isDocsOnly(changedFiles)) {
    return {
      scope: "changed",
      reason:
        "markdown-only change: only the members whose files changed, no dependents (docs keep merge now)",
      args: ["run", "test", `--filter=[${base}]`, ...tail],
    };
  }
  const affected = `--filter=...[${base}]`;
  return {
    scope: "affected+core",
    reason: `code change: the affected members' tests plus ${ALWAYS_TESTED.join(", ")}`,
    args: ["run", "test", affected, ...ALWAYS_TESTED.map((name) => `--filter=${name}`), ...tail],
  };
}

/** One line for the log: the scope, the reason and the command, quoted for a shell. */
export function formatPlan(plan) {
  const quoted = plan.args.map((arg) => (/^[\w@./=:-]+$/.test(arg) ? arg : `'${arg}'`));
  return `Tests (${plan.scope}): ${plan.reason}\n$ pnpm exec turbo ${quoted.join(" ")}`;
}

/**
 * The CLI flags over the environment's defaults.
 * @returns {{ event: string, base: string, dryRun: boolean } | { error: string }}
 */
export function parseArgs(argv, env) {
  const out = { event: env.GITHUB_EVENT_NAME ?? "", base: "HEAD~1", dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--event" || arg === "--base") {
      const value = argv[++i];
      if (!value || value.startsWith("--")) return { error: `${arg} needs a value` };
      out[arg.slice(2)] = value;
    } else return { error: `unknown argument ${arg}` };
  }
  return out;
}

function changedFilesSince(base) {
  const r = spawnSync("git", ["diff", "--name-only", base, "HEAD"], { encoding: "utf8" });
  if (r.status !== 0)
    throw new Error(`git diff --name-only ${base} HEAD failed: ${r.stderr.trim()}`);
  return r.stdout.split("\n").filter(Boolean);
}

function main() {
  const opts = parseArgs(process.argv.slice(2), process.env);
  if ("error" in opts) {
    console.error(`ci-test-plan: ${opts.error}`);
    return 2;
  }
  let changedFiles = [];
  if (opts.event === "pull_request") {
    try {
      changedFiles = changedFilesSince(opts.base);
    } catch (error) {
      console.error(`ci-test-plan: ${error.message}`);
      return 2;
    }
  }
  const plan = testPlan({ event: opts.event, base: opts.base, changedFiles });
  console.log(formatPlan(plan));
  if (opts.dryRun) return 0;
  const r = spawnSync("pnpm", ["exec", "turbo", ...plan.args], { stdio: "inherit" });
  return r.status ?? 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
