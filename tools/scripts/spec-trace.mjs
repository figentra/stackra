#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: spec-trace — FR/SC/P → task → `@covers` test traceability and spec-vs-diff drift for specs in
 *   `.agents/specs/sta-<n>-<slug>/` (owner decision OR12; the plan's §3.6).
 *   trace <dir> [--json]    the matrix: each live FR and P with its tasks and covering tests, each SC with its method
 *   drift <dir> [--base=r]  members changed in the diff that Impact does not name (in `ci`, that no changed spec's
 *                           Impact names); ticked tasks whose paths are gone;
 *                           for a Done spec, Impact "Docs to update" pages the diff does not touch
 *   ci [--base=r]           for every spec folder changed since the base: at Implementing or later, drift; at Done,
 *                           every live FR and P covered by a test (an FR may be covered through a P that is) and
 *                           every SC naming its verification method. Wired into `pnpm validate`.
 * A test covers an ID with a tag anywhere in a `__tests__/*.test.*` file: `@covers sta-163:FR-001 sta-163:P-002`.
 * Dependency-free; reads files and git only, never Linear or the network.
 * Boundary: reads specs, tasks, tests and the git diff; writes nothing. The rules are the published `spec-*` functions of
 *   the repo-checks package; this script keeps the CLI modes and their output.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); STA-348.
 * Secrets: none.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SPECS_DIR, statusOf, testsText } from "./spec-gate.mjs";
import { memberOf } from "./spec-parse.mjs";
import { checks } from "./spec-checks.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const readIf = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

// The rules are published code in @stackra/repo-checks (spec-*.function.ts); core's issue prefix is `sta`.
const PREFIXES = ["sta"];

/** The trace matrix for one spec folder's texts; `tests` is the concatenated text of the test files. */
export const trace = (context) => checks.specTrace({ ...context, prefixes: PREFIXES });

/** Done rules over a trace: every live FR and P tested, every SC with a method. */
export const traceProblems = (t) => checks.specTraceProblems(t, "sta");

/** The text of a spec's `## Impact` section. */
export const impactOf = checks.specImpactOf;

/**
 * Drift between a spec and the changed paths. `exists` tells whether a repo path exists; `named` holds the members
 * another spec in the same diff already names (one branch may carry many specs, as the STA-348 build does).
 */
export const drift = (context) => checks.specDrift({ ...context, prefixes: PREFIXES });

const git = (...a) => {
  try {
    return execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 << 20 });
  } catch {
    return null;
  }
};

function load(dir) {
  return {
    folder: basename(dir),
    spec: readIf(join(dir, "spec.md")),
    plan: readIf(join(dir, "plan.md")),
    tasks: readIf(join(dir, "tasks.md")),
  };
}

/** Whether the repository-relative path `p` exists. */
const existsInRepo = (p) => existsSync(join(ROOT, p));

function main([mode, ...args]) {
  const base = args.find((a) => a.startsWith("--base="))?.slice(7) ?? "origin/main";
  const dir = args.find((a) => !a.startsWith("--"));
  const changed = () => {
    const out = git("diff", "--name-only", `${base}...HEAD`);
    if (out === null) console.log(`spec-trace: no ${base} to diff against; skipping`);
    return (out ?? "").split("\n").filter(Boolean);
  };
  if (mode === "trace" && dir) {
    const t = trace({ ...load(resolve(dir)), tests: testsText() });
    if (args.includes("--json")) return (console.log(JSON.stringify(t, null, 2)), 0);
    for (const r of [...t.frs, ...t.ps])
      console.log(
        `${r.id.padEnd(7)} tasks: ${r.tasks.join(", ") || "—"}  tests: ${r.tested ? "yes" : r.via?.length ? `via ${r.via.join(", ")}` : "no"}`,
      );
    for (const sc of t.scs) console.log(`${sc.id.padEnd(7)} verified by: ${sc.method ?? "—"}`);
    return 0;
  }
  if (mode === "drift" && dir) {
    const problems = drift({ ...load(resolve(dir)), changed: changed(), exists: existsInRepo });
    for (const p of problems) console.error(`spec-trace: ${p}`);
    return problems.length ? 1 : 0;
  }
  if (mode === "ci") {
    const names = changed();
    const dirs = [
      ...new Set(names.flatMap((n) => n.match(/^\.agents\/specs\/[^/]+(?=\/)/)?.slice(0, 1) ?? [])),
    ]
      .map((d) => join(ROOT, d))
      .filter((d) => existsSync(join(d, "spec.md")));
    const specs = dirs.map(load);
    const members = new Set(names.map(memberOf).filter(Boolean));
    const named = new Set(
      [...members].filter((m) => specs.some((s) => impactOf(s.spec).includes(m))),
    );
    let failures = 0;
    let tests;
    for (const s of specs) {
      const status = statusOf(s.spec);
      if (status !== "implementing" && status !== "done") continue;
      const problems = drift({ ...s, changed: names, exists: existsInRepo, named });
      if (status === "done")
        problems.push(...traceProblems(trace({ ...s, tests: (tests ??= testsText()) })));
      for (const p of problems) console.error(`spec-trace: ${SPECS_DIR}/${s.folder}: ${p}`);
      failures += problems.length;
    }
    return failures ? 1 : 0;
  }
  console.error(
    "usage: spec-trace.mjs trace <dir> [--json] | drift <dir> [--base=ref] | ci [--base=ref]",
  );
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(main(process.argv.slice(2)));
