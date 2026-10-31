#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the session-setting check of `pnpm validate` (STA-1699, ADR 0495 decision 3): fails when a source file sets
 *          a Postgres setting for the session instead of the transaction: `set_config(` whose third argument is not the
 *          literal `true`, and the statements `SET app.` and `SET LOCAL app.` (case-insensitive). A session setting
 *          outlives the transaction on a pooled connection and would reach the next caller, so every `app.*` setting
 *          is written by `select set_config(name, value, true)` in the isolation driver, `TenantIsolationService` and
 *          the database drivers' `withScope` and `onReplica`, and nowhere else.
 * Boundary: reads every `.ts`, `.tsx` and `.mjs` file under `packages/`, `services/`, `apps/` and `workers/`
 *           (`node_modules`, `dist`, `.stackra`, `.turbo`, `coverage` skipped); writes nothing. A file in a
 *           `__tests__` folder, or named `*.test.*`, is exempt, and so is each path of `ALLOWED`, an explicit list
 *           with its reason. The scan reads comments and strings alike, so a doc that names the forbidden form is a
 *           finding too: write "a session-level setting" instead. Run directly it prints the findings and exits 1.
 * Runtime: node
 * Governing contract: ADR 0495 (decision 3); ADR 0239 (decision 1); ADR 0473 (RDS Proxy); `.agents/rules/tenancy.md`.
 * Scope: `packages/`, `services/`, `apps/` and `workers/` source files.
 * Owner: release-operations · Secrets: forbidden
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// oxlint-disable stackra/one-declaration-per-file -- reason: a plain-node script module run by pnpm validate, not member source (like package-cycles.mjs); its tests import these names

/** The folders scanned, relative to the repository root. */
export const SCANNED = Object.freeze(["packages", "services", "apps", "workers"]);

/** The source extensions scanned. */
const SOURCE = /\.(?:ts|tsx|mjs)$/;

/** Folders never entered. */
const SKIPPED = new Set(["node_modules", "dist", ".stackra", ".turbo", "coverage", ".git"]);

/**
 * The paths allowed to write an `app.*` setting, each with why. A new entry needs the same and an ADR 0495 reading.
 */
export const ALLOWED = Object.freeze({
  "packages/security/tenancy/src/node/drivers/call-isolation.driver.ts":
    "the isolation driver: scope and tenant settings, transaction-local, in one transaction (ADR 0495 decision 1)",
  "packages/security/tenancy/src/node/services/tenant-isolation.service.ts":
    "withTenant: the one place app.tenant_id is written, transaction-local (ADR 0239 decision 1)",
  "packages/data/database/src/node/drivers/postgres-database.driver.ts":
    "withScope and onReplica: the app.scope_* settings and their replay on a replica, transaction-local",
  "packages/data/database/src/testing/drivers/memory-database.driver.ts":
    "the in-memory twin of withScope, which records the same settings",
});

/** Whether `path` (repository-relative, `/`-separated) is a test file: in a `__tests__` folder or named `*.test.*`. */
const isTest = (path) => path.split("/").includes("__tests__") || /\.test\.[^/]+$/.test(path);

/**
 * The top-level arguments of the call whose `(` is at `open` in `text`, split on commas outside quotes and nested
 * brackets; stops at the matching `)`.
 * shortcut: no template-literal nesting or regex literals; a `set_config(` this misreads is allow-listed or rewritten.
 */
function argumentsAt(text, open) {
  const args = [];
  let depth = 0;
  let quote = "";
  let current = "";
  for (let at = open + 1; at < text.length; at += 1) {
    const char = text[at];
    if (quote !== "") {
      current += char;
      if (char === "\\") {
        at += 1;
        current += text[at] ?? "";
      } else if (char === quote) quote = "";
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
    } else if (char === "(" || char === "[" || char === "{") {
      depth += 1;
      current += char;
    } else if (char === ")" && depth === 0) {
      args.push(current);
      return args;
    } else if (char === ")" || char === "]" || char === "}") {
      depth -= 1;
      current += char;
    } else if (char === "," && depth === 0) {
      args.push(current);
      current = "";
    } else current += char;
  }
  return args;
}

/**
 * The problems of one file's `text`: each as a short description with its 1-based line.
 *
 * @example
 * settingProblems("select set_config('app.tenant_id', ?, false)"); // [{ line: 1, text: "set_config with ..." }]
 */
export function settingProblems(text) {
  const problems = [];
  const lineOf = (at) => text.slice(0, at).split("\n").length;
  for (const match of text.matchAll(/set_config\s*\(/gi)) {
    const args = argumentsAt(text, match.index + match[0].length - 1);
    if (args.length >= 3 && args[2].trim().toLowerCase() !== "true")
      problems.push({
        line: lineOf(match.index),
        text: "set_config with a third argument other than the literal true sets a session-level setting",
      });
  }
  for (const match of text.matchAll(/\bSET\s+(?:LOCAL\s+)?app\./gi))
    problems.push({
      line: lineOf(match.index),
      text: `\`${match[0]}\` sets an app.* setting by statement; use select set_config(name, value, true) in the isolation driver`,
    });
  return problems;
}

/** Every scannable file under `dir`, as repository-relative paths. */
function sources(root, dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (SKIPPED.has(entry.name)) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) found.push(...sources(root, path));
    else if (entry.isFile() && SOURCE.test(entry.name)) found.push(path);
  }
  return found;
}

/**
 * The findings of the repository at `root`: one `{ dir, text }` per forbidden setting, `dir` being the file and line.
 *
 * @param root - the repository root.
 * @param allowed - the allow-listed paths; the shipped list by default.
 * @example
 * sessionSettingFindings(root); // [{ dir: "services/orders/src/x.ts:12", text: "..." }]
 */
export function sessionSettingFindings(root, allowed = ALLOWED) {
  const findings = [];
  for (const area of SCANNED)
    for (const path of sources(root, area)) {
      if (isTest(path) || Object.hasOwn(allowed, path)) continue;
      for (const { line, text } of settingProblems(readFileSync(join(root, path), "utf8")))
        findings.push({ dir: `${path}:${line}`, text });
    }
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const findings = sessionSettingFindings(root);
  for (const { dir, text } of findings)
    console.error(`${relative(root, join(root, dir))}: ${text}`);
  if (findings.length > 0) {
    console.error(`\n${findings.length} finding(s).`);
    process.exit(1);
  }
}
