#!/usr/bin/env node
/**
 * spec-gate — the clarify-before-build gate for spec-kit specs.
 *
 *   node tools/scripts/spec-gate.mjs plan <spec.md>   exit 1 unless the spec may be planned
 *   node tools/scripts/spec-gate.mjs ci [--base=ref]   check every spec changed since the base ref
 *
 * A spec may be planned when it has `**Clarifications status**: complete`, a `**Linear**: STA-n`
 * key, a fully answered `## Impact` section and no `[NEEDS CLARIFICATION` marker.
 * `setup-plan.sh` runs `plan`; CI runs `ci` (wired into `pnpm validate`). Dependency-free.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const IMPACT_FIELDS = [
  "Apps touched",
  "Services touched",
  "Packages touched",
  "Cross-service events",
  "Tenancy and data",
  "Secrets",
  "ADR needed",
  "New dependencies",
];

/** Problems that stop a spec from being planned; empty means it may be. */
export function checkSpec(text) {
  const body = text.replace(/<!--[\s\S]*?-->/g, "");
  const problems = [];
  if (!/^\*\*Clarifications status\*\*:\s*complete\s*$/im.test(body))
    problems.push("`**Clarifications status**` is not `complete` (run /speckit.clarify)");
  if (!/^\*\*Linear\*\*:\s*STA-\d+\b/m.test(body))
    problems.push("`**Linear**` has no STA-n key (spec-linear.mjs issue, or the Linear MCP)");
  if (/\[NEEDS CLARIFICATION/i.test(body)) problems.push("a `[NEEDS CLARIFICATION` marker remains");

  const impact = body.match(/^## Impact\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1];
  if (impact === undefined) {
    problems.push("the `## Impact` section is missing");
  } else {
    for (const field of IMPACT_FIELDS) {
      const value = impact.match(new RegExp(`^- \\*\\*${field}\\*\\*:[ \\t]*(.*)$`, "m"))?.[1];
      if (value === undefined) problems.push(`Impact: \`${field}\` is missing`);
      else if (value.trim() === "" || /^\[.*\]$/.test(value.trim()))
        problems.push(`Impact: \`${field}\` is unanswered`);
    }
  }
  return problems;
}

function gate(file) {
  const problems = checkSpec(readFileSync(file, "utf8"));
  for (const p of problems) console.error(`spec-gate: ${file}: ${p}`);
  return problems.length;
}

/** specs/<feature>/spec.md files for every path changed since `base`. */
function changedSpecs(base) {
  let names = "";
  try {
    names = execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: ROOT,
      encoding: "utf8",
    });
  } catch {
    console.log(`spec-gate: no ${base} to diff against; skipping`);
  }
  const features = new Set(
    names.split("\n").flatMap((n) => n.match(/^specs\/[^/]+(?=\/)/)?.slice(0, 1) ?? []),
  );
  return [...features].map((f) => join(ROOT, f, "spec.md")).filter((p) => existsSync(p));
}

function main([mode, arg]) {
  if (mode === "plan" && arg) return gate(arg) ? 1 : 0;
  if (mode === "ci") {
    const base = arg?.startsWith("--base=") ? arg.slice(7) : "origin/main";
    let failures = 0;
    const plan = join(ROOT, ".specify/scripts/bash/setup-plan.sh");
    if (existsSync(plan) && !readFileSync(plan, "utf8").includes("spec-gate.mjs")) {
      console.error("spec-gate: setup-plan.sh lost its gate call (re-add `spec-gate.mjs plan`)");
      failures++;
    }
    for (const spec of changedSpecs(base)) failures += gate(spec);
    return failures ? 1 : 0;
  }
  console.error("usage: spec-gate.mjs plan <spec.md> | ci [--base=ref]");
  return 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exit(main(process.argv.slice(2)));
