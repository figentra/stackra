/**
 * Stackra file contract:
 * Purpose: `checkEnv(root)`, the names-only environment check (`runway env check`, ADR 0173 amendment 2026-11-04,
 *          decision 4). It collects every declared name: the `env` rows of each deployable member's committed
 *          `stackra.manifest.json` (gen), each member runway's `secrets:` and the `names:` of each workflow step that
 *          uses the `secrets-decrypt` action. Errors: a declared name with no sops scope (the root runway names no
 *          `project`, so `products/<project>/<env>` cannot be named). Warnings: a raw read (`process.env.X`,
 *          `import.meta.env.X`) of a name nothing declares, a member runway secret no code declares, and a
 *          `secrets-decrypt` step that decrypts its whole `scope` without naming what it reads.
 * Boundary: reads files only: no login, no decrypt, never a value. Scopes follow figentra/secrets (ADR 0525): a
 *           product's runtime names live in `products/<project>/<dev|staging|production>` (a preview reads dev's), and
 *           a workflow name's scope is its step's `scope`. Raw reads are scanned under `apps`, `packages`, `services`
 *           and `workers`, skipping the paths `stackra/no-raw-env` exempts and the names the platform sets
 *           (`NODE_ENV`, `CI`, `GITHUB_*`, Vite's `DEV`/`PROD`/`MODE`).
 * Runtime: node
 * Governing contract: ADR 0525 (sops scopes); ADR 0173 amendment 2026-11-04 (names declared once); STA-2104.
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

/** A literal secret name; an expression such as `${{ inputs.names }}` is not one. */
const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;

/** The `with:` of each step anywhere in a parsed workflow or action that uses the `secrets-decrypt` action. */
function decryptSteps(node: unknown, out: { names?: string; scope?: string }[] = []): typeof out {
  if (Array.isArray(node)) for (const item of node) decryptSteps(item, out);
  else if (typeof node === "object" && node !== null) {
    const record = node as Record<string, unknown>;
    if (typeof record["uses"] === "string" && record["uses"].includes("secrets-decrypt")) {
      const given = (record["with"] ?? {}) as Record<string, unknown>;
      out.push({
        ...(typeof given["names"] === "string" ? { names: given["names"] } : {}),
        ...(typeof given["scope"] === "string" ? { scope: given["scope"] } : {}),
      });
    }
    for (const value of Object.values(record)) decryptSteps(value, out);
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
            "has no sops scope: the root runway.yaml names no `project`, so `products/<project>/<env>` cannot be named",
        });
    }
  }

  // Member runway secrets: their scope is the product's scope of the environment.
  for (const environment of Object.keys(runways.root.environments ?? {}))
    for (const entry of secretSyncPlan(environment, runways))
      for (const name of entry.names) {
        declared.add(name);
        const where = `${entry.folder}/runway.yaml`;
        if (entry.scope === null)
          findings.push({
            level: "error",
            name,
            where,
            message: `has no sops scope in ${environment}: name the \`project\` in the root runway.yaml`,
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

  // Workflow secrets-decrypt steps.
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
      for (const step of decryptSteps(parsed)) {
        for (const name of (step.names ?? "").split(","))
          if (SECRET_NAME.test(name.trim())) declared.add(name.trim());
        if ((step.names ?? "").trim() === "" && step.scope !== undefined)
          findings.push({
            level: "warning",
            name: step.scope,
            where,
            message: "decrypts every secret in the scope: name what the step reads with `names`",
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
