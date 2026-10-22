#!/usr/bin/env node
// SessionStart (startup|resume|compact|clear): re-state the invariants that must survive compaction, plus repo state.
import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readStdin, context } from "./_io.mjs";

const input = await readStdin();
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const sh = (cmd) => {
  try {
    return execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
};

const git = existsSync(`${root}/.git`);
const branch = git ? sh("git rev-parse --abbrev-ref HEAD") : "(no git)";
const dirty = git ? sh("git status --short | head -15") : "";

const lines = [
  `[STACKRA SESSION — ${input.source ?? "start"}] branch: ${branch}`,
  "Invariants:",
  "0. Layout: apps/{console,docs,mobile}, packages/<category>/<name>, services/*, workers/* (Cloudflare Workers, tier:app, ADR 0284) are independent members in plain TypeScript (entry src/main.ts; no Encore files in a service — Encore is the generated runtime in the gitignored .stackra/encore, ADRs 0091/0124), mobile uses code-based navigation, docs in apps/docs/src.",
  "1. Packages live at packages/<category>/<name> (flat inside one category) and are named @stackra/<name>. A package never imports an app, a service or another package's src/ (packages/tooling/oxlint/src/boundaries.jsonc).",
  "2. Every member extends one @stackra/typescript-config preset, one @stackra/vitest-config preset, and declares exactly one turbo tier tag (tier:config|lib|app|service).",
  "3. Versions live only in pnpm-workspace.yaml catalogs (catalogMode: strict). A member's package.json names catalog:<name> or workspace:* — `pnpm validate` fails otherwise.",
  "4. Every test file sits directly in a __tests__/ folder beside its subject (src/**/__tests__/<name>.test.ts); there is no root tests/ folder and no .spec. An app's e2e lives in that app (ADR 0022, enforced by pnpm validate).",
  "5. Docs are apps/docs (Mintlify). Pages, assets and ADRs all live in apps/docs/src (ADRs in apps/docs/src/adr).",
  "6. Secrets: never print, read or write a value. Values are set by a human; developer tokens live in the vault.",
  "7. Done = `pnpm verify` green (format, lint, typecheck, test, build, validate, boundaries, knip). Conventional commits; changesets for releases.",
];
if (dirty) lines.push("Working tree:", dirty);

// Best-effort: today's OpenCode spend against the cap; any failure (no opencode, slow stats) just omits the line.
try {
  const { costOf, evaluate, fetchStats, formatLine, loadBudget } =
    await import("../../tools/scripts/ai-spend.mjs");
  const budget = loadBudget(`${root}/.agents/routing.yaml`);
  const today = costOf(fetchStats(0, { timeout: 4000 }));
  lines.push(
    formatLine(evaluate({ today, week: costOf(fetchStats(7, { timeout: 4000 })) }, budget)),
  );
} catch {}

// Best-effort: open Linear work (In Progress + owner steps). Offline, no vault login or no key → nothing, within ~3s.
try {
  const script = `${root}/tools/scripts/linear.mjs`;
  const hasKey = process.env.LINEAR_AGENT_TOKEN || process.env.LINEAR_API_KEY;
  const [cmd, args] = hasKey
    ? [process.execPath, [script, "digest"]]
    : [
        "infisical",
        [
          "run",
          "--env=dev",
          "--path=/agents",
          "--silent",
          "--",
          process.execPath,
          script,
          "digest",
        ],
      ];
  const out = execFileSync(cmd, args, {
    cwd: root,
    timeout: 3000,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
  if (out) lines.push("Linear (pnpm linear start|review|done keeps it current):", out);
} catch {}
context("SessionStart", lines.join("\n"));
