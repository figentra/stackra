/**
 * Stackra file contract:
 * Purpose: `checkEnv(root)`, the names-only environment check (`runway env check`, ADR 0173 amendment 2026-11-04,
 *          decision 4). It collects every declared name: the `env` rows of each deployable member's committed
 *          `stackra.manifest.json` (gen), each member runway's `secrets:` and each workflow Infisical step's
 *          `secret-name:`. Errors: a declared name with no Infisical home (the root runway names no `project`, no
 *          runtime path for a member runway's secrets, or a `secret-name` with no `secret-path`). Warnings: a raw
 *          read (`process.env.X`, `import.meta.env.X`) of a name nothing declares, a member runway secret no code
 *          declares, and a workflow step that exports a whole `secret-path` without naming its secrets.
 * Boundary: reads files only: no login, no Infisical call, never a value. Homes follow the Infisical plan of
 *           2026-11-04: `<project>-runtime` (dev, staging) and `<project>-runtime-prod` (production) at
 *           `/runtime/<member>`; a workflow name's project is its step's (an org variable), so its home is its path.
 *           Raw reads are scanned under `apps`, `packages`, `services` and `workers`, skipping the paths
 *           `stackra/no-raw-env` exempts and the names the platform sets (`NODE_ENV`, `CI`, `GITHUB_*`, Vite's
 *           `DEV`/`PROD`/`MODE`).
 * Runtime: node
 * Governing contract: ADR 0173 (amendment 2026-11-04); ADR 0512 as amended; STA-2104.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { parse } from "yaml";

import { readRunways } from "#node/functions/read-runways.function";
import { secretSyncPlan } from "#node/functions/secret-sync-plan.function";
import type { EnvFinding } from "#node/types/env-finding.type";

/** The member roots whose sources are scanned for raw reads. */
const SOURCE_ROOTS = ["apps", "packages", "services", "workers"];

/** Folders never scanned. */
const SKIP_DIRS = new Set(["node_modules", "dist", ".stackra", ".turbo", "coverage", ".expo"]);

/** The paths `stackra/no-raw-env` exempts (configuration classes, generated code, tooling, tests). */
const EXEMPT = [
  /\.config\.[cm]?[jt]sx?$/,
  /\.generated\./,
  /(?:^|\/)generated\//,
  /(?:^|\/)(?:tools|scripts)\//,
  /(?:^|\/)(?:__tests__|e2e)\//,
  /\.(?:test|spec)\.[cm]?[jt]sx?$/,
];

/** A named read of the environment. */
const RAW_READ =
  /(?:process\.env|import\.meta\.env)(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*["']([A-Za-z0-9_]+)["']\s*\])/g;

// shortcut: a fixed list of names the platform or toolchain sets; extend it when a new tool's variable shows up.
const PLATFORM =
  /^(?:NODE_|GITHUB_|RUNNER_|ENCORE_|TURBO_|INFISICAL_|EAS_|CLAUDE_|npm_)|^(?:CI|PATH|HOME|DEV|PROD|MODE|SSR|BASE_URL|TZ|VITEST)$/;

// shortcut: a text scan, not a parse; comments are dropped so documentation examples are not reads, but a read inside a
// string (generated source) is still reported. The lint rule, which reads the AST, is the exact check.
/** `text` with block comments and whole-line `//` comments blanked. */
const withoutComments = (text: string): string =>
  text.replaceAll(/\/\*[\s\S]*?\*\//g, "").replaceAll(/^\s*\/\/.*$/gm, "");

/** Every source file under `dir`, relative to `root`. */
function sources(root: string, dir: string): string[] {
  const out: string[] = [];
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(path, entry.name));
      } else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !entry.name.endsWith(".d.ts"))
        out.push(relative(root, join(path, entry.name)));
    }
  };
  if (existsSync(join(root, dir))) walk(join(root, dir));
  return out;
}

/** Each `{ secret-name?, secret-path? }` block anywhere in a parsed workflow or action. */
function infisicalSteps(node: unknown, out: { name?: string; path?: string }[] = []): typeof out {
  if (Array.isArray(node)) for (const item of node) infisicalSteps(item, out);
  else if (typeof node === "object" && node !== null) {
    const record = node as Record<string, unknown>;
    if ("secret-name" in record || "secret-path" in record) {
      const name = record["secret-name"];
      const path = record["secret-path"];
      out.push({
        ...(typeof name === "string" ? { name } : {}),
        ...(typeof path === "string" ? { path } : {}),
      });
    }
    for (const value of Object.values(record)) infisicalSteps(value, out);
  }
  return out;
}

/**
 * The names-only environment check of the repository at `root`.
 *
 * @param root - the repository root (it holds `runway.yaml`).
 * @returns the findings, errors first; an empty list passes.
 * @example
 * checkEnv(repositoryRoot(process.cwd())).filter((finding) => finding.level === "error");
 */
export function checkEnv(root: string): EnvFinding[] {
  const findings: EnvFinding[] = [];
  const declared = new Set<string>();
  const runways = readRunways(root);
  const { project } = runways.root;

  // Gen's rows, per deployable member.
  const codeNames = new Set<string>();
  for (const { member, folder = "apps" } of runways.members) {
    const where = `${folder}/${member}/stackra.manifest.json`;
    if (!existsSync(join(root, where))) continue;
    const manifest = JSON.parse(readFileSync(join(root, where), "utf8")) as {
      env?: readonly { name?: unknown; home?: unknown }[];
    };
    for (const row of manifest.env ?? []) {
      if (typeof row.name !== "string") continue;
      declared.add(row.name);
      codeNames.add(row.name);
      if (project === undefined || project === "")
        findings.push({
          level: "error",
          name: row.name,
          where,
          message:
            "has no Infisical home: the root runway.yaml names no `project`, so `<project>-runtime` cannot be named",
        });
    }
  }

  // Member runway secrets: their home is the runtime path the root runway gives them.
  for (const environment of Object.keys(runways.root.environments ?? {}))
    for (const entry of secretSyncPlan(environment, runways))
      for (const name of entry.names) {
        declared.add(name);
        const where = `${entry.folder}/runway.yaml`;
        if (entry.path === null)
          findings.push({
            level: "error",
            name,
            where,
            message: `has no Infisical home in ${environment}: set \`secrets.defaultPath\` and its \`providers.infisical.paths\` entry in the root runway.yaml`,
          });
        else if (!codeNames.has(name) && entry.writer === "encore")
          findings.push({
            level: "warning",
            name,
            where,
            message:
              "is a deploy secret no configuration class declares: declare it with `@Secret`",
          });
      }

  // Workflow Infisical steps.
  for (const dir of [".github/workflows", ".github/actions"]) {
    const files = existsSync(join(root, dir))
      ? readdirSync(join(root, dir), { recursive: true, encoding: "utf8" }).filter((file) =>
          /\.ya?ml$/.test(file),
        )
      : [];
    for (const file of files) {
      const where = `${dir}/${file}`;
      let parsed: unknown;
      try {
        parsed = parse(readFileSync(join(root, where), "utf8"));
      } catch {
        continue; // actionlint reports a workflow that does not parse
      }
      for (const step of infisicalSteps(parsed)) {
        const names = (step.name ?? "")
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name !== "");
        for (const name of names) declared.add(name);
        if (names.length > 0 && step.path === undefined)
          for (const name of names)
            findings.push({
              level: "error",
              name,
              where,
              message: "has no Infisical home: give its step a `secret-path`",
            });
        if (names.length === 0 && step.path !== undefined)
          findings.push({
            level: "warning",
            name: step.path,
            where,
            message:
              "exports every secret in the path: name what the step reads with `secret-name`",
          });
      }
    }
  }

  // Raw reads of names nothing declares (warnings until `stackra/no-raw-env` moves to error).
  for (const dir of SOURCE_ROOTS)
    for (const file of sources(root, dir)) {
      if (EXEMPT.some((pattern) => pattern.test(file))) continue;
      const text = withoutComments(readFileSync(join(root, file), "utf8"));
      for (const match of text.matchAll(RAW_READ)) {
        const name = match[1] ?? match[2] ?? "";
        if (PLATFORM.test(name) || declared.has(name)) continue;
        findings.push({
          level: "warning",
          name,
          where: file,
          message:
            "is read raw and declared nowhere: declare it in a `Config({ schema, env })` class or with `@Secret`",
        });
      }
    }

  return [
    ...findings.filter((finding) => finding.level === "error"),
    ...findings.filter((finding) => finding.level === "warning"),
  ];
}
