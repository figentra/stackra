#!/usr/bin/env node
// SessionStart (startup|resume|compact|clear): re-state the invariants that must survive compaction, plus repo state.
import { execSync } from "node:child_process";
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
  "0. Layout: apps/{console,docs,mobile}, packages/<category>/<name>, services/* are independent members (no Encore; entry src/main.ts), mobile uses code-based navigation, docs in apps/docs/src.",
  "1. Packages live at packages/<category>/<name> (flat inside one category) and are named @stackra/<name>. A package never imports an app, a service or another package's src/ (packages/tooling/oxlint/boundaries.jsonc).",
  "2. Every member extends one @stackra/typescript-config preset, one @stackra/vitest-config preset, and declares exactly one turbo tier tag (tier:config|lib|app|service).",
  "3. Versions live only in pnpm-workspace.yaml catalogs (catalogMode: strict). A member's package.json names catalog:<name> or workspace:* — `pnpm validate` fails otherwise.",
  "4. Tests sit next to the code (src/**/__tests__); there is no root tests/ folder. An app's e2e lives in that app.",
  "5. Docs are apps/docs (Mintlify). Pages, assets and ADRs all live in apps/docs/src (ADRs in apps/docs/src/adr).",
  "6. Secrets: never print, read or write a value. Values are set by a human; developer tokens live in the vault.",
  "7. Done = `pnpm verify` green (format, lint, typecheck, test, build, validate, boundaries, knip). Conventional commits; changesets for releases.",
];
if (dirty) lines.push("Working tree:", dirty);
context("SessionStart", lines.join("\n"));
