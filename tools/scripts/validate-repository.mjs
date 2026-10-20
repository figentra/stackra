#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the repository-shape gate run by `pnpm validate` (part of `pnpm verify`). Every workspace member uses
 *          catalog:/workspace: versions only, is named by placement (packages @stackra/<name>, apps @figentra/<dir>, services @figentra/service-<dir>), declares exactly one turbo tier tag matching its
 *          directory, extends a @stackra/typescript-config preset, and depends on no forbidden package.
 *          A service declares its root module (`stackra.module`, ADR 0090) and holds no Encore file (ADR 0126).
 *          Every test file anywhere in the repository sits directly in a __tests__/ folder (ADR 0022).
 *          Every JSON config is .jsonc unless its reader cannot take one (MUST_STAY_JSON).
 *          Prints the findings and exits 1; prints nothing on success. Adapted from Figentra's checks 1–5.
 * Scope: every member listed by `pnpm -r list --json --depth -1`; test placement covers every non-ignored file.
 * Owner: release-operations · Secrets: forbidden
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonc } from "./jsonc.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Architecture decisions enforced at the manifest level (.agents/rules/not-built-yet.md, ADR 0011 and the ADRs named). */
export const FORBIDDEN_DEPENDENCIES = [
  "eslint",
  "prettier",
  "jest",
  "@nestjs/core",
  "@nestjs/common",
  "reflect-metadata",
  "prisma",
  "@prisma/client",
  "drizzle-orm",
  "express",
  "fastify",
  "typeorm",
  "knex",
  "expo-router", // 0011, 0061: code-based React Navigation
  "zustand", // 0079: client state is @stackra/state
  "@tanstack/store", // 0079
  "i18next", // 0080: the ported @stackra/i18n
  "react-i18next", // 0080
  "class-validator", // 0095: @stackra/validation on Zod
  "class-transformer", // 0095
  "meilisearch", // 0089: search engines are Pro drivers (stackra-pro), Postgres first here
  "@opensearch-project/opensearch", // 0089
];

const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

/** The one tier tag a member's directory implies; null for the repository root. */
export function tierFor(dir) {
  if (dir === "") return null;
  if (dir.startsWith("apps/")) return "tier:app";
  if (dir.startsWith("packages/tooling/")) return "tier:config";
  if (dir.startsWith("packages/")) return "tier:lib";
  if (dir.startsWith("services/")) return "tier:service";
  return "unknown";
}

/** Expected npm name by placement: packages @stackra/<name>, apps @figentra/<dir>, services @figentra/service-<dir>. */
export function expectedName(dir) {
  const base = dir.split("/").at(-1);
  if (dir.startsWith("apps/")) return `@figentra/${base}`;
  if (dir.startsWith("services/")) return `@figentra/service-${base}`;
  if (dir.startsWith("packages/tooling/")) return `@stackra/${base}-config`;
  if (dir.startsWith("packages/")) return `@stackra/${base}`;
  return null;
}

/**
 * Findings for one member. `files` holds the parsed turbo.jsonc / tsconfig.json (undefined when absent), so the
 * rules are testable without touching the disk.
 */
export function check({ dir, pkg, turbo, tsconfig }) {
  const out = [];
  const want = expectedName(dir);
  if (want && pkg.name !== want) out.push(`package name ${pkg.name} must be ${want}`);

  for (const field of DEPENDENCY_FIELDS) {
    for (const [dep, version] of Object.entries(pkg[field] ?? {})) {
      if (FORBIDDEN_DEPENDENCIES.includes(dep))
        out.push(`${field}.${dep} is a forbidden dependency`);
      // peerDependencies state a compatible range for consumers; they cannot name a catalog.
      if (field === "peerDependencies") continue;
      if (!version.startsWith("catalog:") && !version.startsWith("workspace:"))
        out.push(
          `${field}.${dep} = "${version}" — add it to a catalog in pnpm-workspace.yaml and use catalog:<name>`,
        );
    }
  }

  const tier = tierFor(dir);
  if (tier === null) return out;
  if (tier === "unknown") out.push("not under apps/*, packages/<category>/<name> or services/*");
  if (!turbo) out.push("turbo.jsonc missing");
  else {
    if (!turbo.extends?.includes("//")) out.push('turbo.jsonc does not extend "//"');
    const tags = (turbo.tags ?? []).filter((t) => t.startsWith("tier:"));
    if (tags.length !== 1 || tags[0] !== tier)
      out.push(`turbo.jsonc tier tags ${JSON.stringify(tags)} — expected exactly ["${tier}"]`);
  }
  // The preset package extends its own files by relative path; it cannot depend on itself.
  if (tsconfig && dir !== "packages/tooling/typescript") {
    const presets = [tsconfig.extends].flat();
    if (!presets.every((p) => String(p ?? "").startsWith("@stackra/typescript-config/")))
      out.push("tsconfig.json must extend @stackra/typescript-config/<preset>");
  }
  return out;
}

/** Required-files and manifest-hygiene findings for one member. `files` is the set of top-level entry names. */
export function checkFiles({ dir, pkg, files, agents, licenseText, rootLicense }) {
  const out = [];
  for (const f of ["README.md", "AGENTS.md", "CHANGELOG.md", "LICENSE"])
    if (!files.includes(f)) out.push(`${f} missing`);
  if (files.includes("AGENTS.md") && !/^## PII/m.test(agents ?? ""))
    out.push('AGENTS.md has no "## PII" section');
  if (files.includes("LICENSE") && licenseText !== rootLicense)
    out.push("LICENSE differs from the root LICENSE");
  if (!pkg.description?.trim()) out.push("package.json has no description");
  if (pkg.license !== "MIT") out.push('package.json license must be "MIT" (ADR 0024)');
  if (tierFor(dir) === "tier:lib") {
    if (pkg.sideEffects !== false) out.push("package.json sideEffects must be false");
    out.push(...checkExports(pkg.exports));
  }
  return out;
}

const MODULE = /\.(ts|tsx|mts|js|mjs|cjs)$/;

/**
 * ADR 0025: a module entry is `{ "@stackra/source": "./src/….ts", types: "./dist/….d.mts", default: "./dist/….mjs" }`,
 * with the source condition first. A plain string entry is a static asset (CSS, JSON, a folder, `./resources/*`) and
 * must not name a module.
 */
export function checkExports(exports) {
  const out = [];
  const entries = typeof exports === "string" ? [[".", exports]] : Object.entries(exports ?? {});
  for (const [key, target] of entries) {
    if (typeof target === "string") {
      if (MODULE.test(target))
        out.push(
          `exports["${key}"] names a module as a plain string — use the @stackra/source/types/default shape (ADR 0025)`,
        );
      continue;
    }
    const keys = Object.keys(target ?? {});
    const src = target?.["@stackra/source"];
    if (keys[0] !== "@stackra/source" || !/^\.\/src\/.+\.tsx?$/.test(src ?? ""))
      out.push(`exports["${key}"] must list "@stackra/source": "./src/….ts" first (ADR 0025)`);
    if (!/^\.\/dist\/.+\.d\.mts$/.test(target?.types ?? ""))
      out.push(`exports["${key}"].types must be ./dist/….d.mts (ADR 0025)`);
    if (!/^\.\/dist\/.+\.mjs$/.test(target?.default ?? ""))
      out.push(`exports["${key}"].default must be ./dist/….mjs (ADR 0025)`);
  }
  return out;
}

const ENCORE_FILE = /(^|\/)(encore\.service\.ts|encore\.app)$/;

/**
 * Findings for a service member (ADR 0126): plain TypeScript with a `src/main.ts` entry and a root module named by
 * `package.json` `stackra.module` (ADR 0090), and no Encore file — Encore is generated into .stackra/encore
 * (ADRs 0091, 0124). `paths` are the member's files relative to the member directory.
 */
export function checkService({ pkg, paths }) {
  const out = [];
  if (!paths.includes("src/main.ts")) out.push("src/main.ts missing");
  const module = pkg.stackra?.module;
  if (!module)
    out.push('package.json has no "stackra": { "module": "./src/<name>.module.ts" } (ADR 0090)');
  else if (!paths.includes(module.replace(/^\.\//, "")))
    out.push(`package.json stackra.module ${module} does not exist`);
  for (const p of paths.filter((f) => ENCORE_FILE.test(f)))
    out.push(`${p}: services hold no Encore files; stackra gen generates them (ADR 0124)`);
  return out;
}

/**
 * JSON files whose reader rejects comments or a .jsonc name, each with the reason. Any other *.json is a config whose
 * tool reads JSONC, so it must be .jsonc (tsconfig files and the typescript-config presets keep the .json name tsc
 * resolves but already take comments). A new entry here names the reader and why it cannot take JSONC.
 */
export const MUST_STAY_JSON = [
  [/(^|\/)package\.json$/, "pnpm/npm manifest: strict JSON, fixed name"],
  [
    /(^|\/)tsconfig(\.[\w-]+)?\.json$/,
    "tsc finds tsconfig.json by name; comments allowed in place",
  ],
  [
    /^packages\/tooling\/typescript\/[\w-]+\.json$/,
    "tsconfig presets via package exports; comments allowed",
  ],
  [
    /^tools\/scaffold\/templates\/packages\/tooling\/base\.json$/,
    "generic preset template: rename to .jsonc for a JSONC tool",
  ],
  [/^\.claude\/[\w.-]+\.json$/, "Claude Code settings/launch: fixed .json names"],
  [/^\.mcp\.json$/, "Claude Code reads only .mcp.json; generated from .mcp.yaml"],
  [/^\.changeset\/config\.json$/, "@changesets/config JSON.parse on a fixed path"],
  [/^\.github\/branch-protection\.json$/, "GitHub REST API payload"],
  [/(^|\/)src\/docs\.json$/, "Mintlify parses docs.json with JSON.parse"],
  [/(^|\/)(app|eas)\.json$/, "Expo/EAS: fixed names, rewritten by the expo/eas CLIs"],
  [/^\.specify\//, "spec-kit CLI output, read by its scripts with jq / python json"],
  [/^\.(agents|claude)\/skills\//, "vendored skills: upstream content"],
  [
    /^packages\/experience\/brand\/src\/tokens\/tokens\.json$/,
    "exported token data for non-TS consumers",
  ],
];

/**
 * JSONC files whose reader has no YAML support, each with the reader. Repo-owned config (read by tools/scripts)
 * is YAML; a .jsonc is allowed only where the tool cannot read YAML. A new entry names the reader.
 */
export const MUST_STAY_JSONC = [
  [/(^|\/)turbo\.jsonc$/, "Turborepo: turbo.json / turbo.jsonc only"],
  [
    /^\.oxlintrc\.jsonc$|^packages\/tooling\/oxlint\/[\w-]+\.jsonc$/,
    "oxlint: JSON/JSONC or oxlint.config.ts",
  ],
  [/^\.oxfmtrc\.jsonc$/, "oxfmt: .oxfmtrc.json / .jsonc only"],
  [/^knip\.jsonc$/, "knip: JSON/JSONC or knip.ts"],
  [/^opencode\.jsonc$/, "OpenCode: opencode.json / .jsonc only"],
];

/**
 * Every *.json path not on MUST_STAY_JSON (its reader takes comments, so at least .jsonc) and every *.jsonc path
 * not on MUST_STAY_JSONC (repo-owned config is YAML).
 */
export function checkJsonConfigs(paths) {
  const out = [];
  for (const p of paths) {
    if (p.endsWith(".json") && !MUST_STAY_JSON.some(([re]) => re.test(p)))
      out.push(
        `${p}: convert to .yaml (or .jsonc if its reader has no YAML support), or add it to MUST_STAY_JSON with the reason`,
      );
    else if (p.endsWith(".jsonc") && !MUST_STAY_JSONC.some(([re]) => re.test(p)))
      out.push(
        `${p}: convert to .yaml, or add it to MUST_STAY_JSONC naming the reader without YAML support`,
      );
  }
  return out;
}

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;

/**
 * ADR 0022: every `*.test.*` file sits directly in `__tests__/`; `.spec.*` is not used. Tier infixes (`.int`,
 * `.contract`, `.e2e`, `.load`) go before `.test` (TS1/TS2). No Storybook: `*.stories.*` is banned (ADR 0126).
 * `.old/` is archived code.
 */
export function checkTestPlacement(paths) {
  const out = [];
  for (const p of paths) {
    if (p.startsWith(".old/")) continue;
    if (/\.stories\.[cm]?[jt]sx?$/.test(p))
      out.push(`${p}: no Storybook; test the component in __tests__/`);
    if (!TEST_FILE.test(p)) continue;
    const parts = p.split("/");
    if (parts.at(-2) !== "__tests__")
      out.push(`${p}: test files go in a __tests__/ folder (ADR 0022)`);
    if (/\.spec\./.test(parts.at(-1)))
      out.push(`${p}: name it <subject>.test.<ext>, not .spec (ADR 0022)`);
  }
  return out;
}

function main() {
  const members = JSON.parse(
    execFileSync("pnpm", ["-r", "list", "--json", "--depth", "-1"], {
      cwd: ROOT,
      encoding: "utf8",
    }),
  );
  let failed = 0;
  const rootLicense = readFileSync(join(ROOT, "LICENSE"), "utf8");
  const read = (p, f) => (existsSync(join(p, f)) ? readFileSync(join(p, f), "utf8") : undefined);
  const report = (dir, findings) => {
    for (const f of findings) console.error(`${dir || "."}: ${f}`);
    failed += findings.length;
  };
  const repoFiles = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--deduplicate"],
    { cwd: ROOT, encoding: "utf8" },
  )
    .split("\n")
    .filter((p) => p && existsSync(join(ROOT, p)));
  report("", checkTestPlacement(repoFiles));
  report("", checkJsonConfigs(repoFiles));
  // ADR 0024 decision 2: the brand marks carry their all-rights-reserved NOTICE.
  if (!existsSync(join(ROOT, "packages/experience/brand/src/logos/NOTICE")))
    report("packages/experience/brand", ["src/logos/NOTICE missing (ADR 0024)"]);
  for (const { path } of members) {
    const dir = relative(ROOT, path);
    const at = (f) => (existsSync(join(path, f)) ? readJsonc(join(path, f)) : undefined);
    const pkg = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
    report(
      dir,
      check({
        dir,
        pkg,
        turbo: dir === "" ? undefined : at("turbo.jsonc"),
        tsconfig: dir === "" ? undefined : at("tsconfig.json"),
      }),
    );
    if (dir !== "")
      report(
        dir,
        checkFiles({
          dir,
          pkg,
          files: readdirSync(path),
          agents: read(path, "AGENTS.md"),
          licenseText: read(path, "LICENSE"),
          rootLicense,
        }),
      );
    if (tierFor(dir) === "tier:service")
      report(
        dir,
        checkService({
          pkg,
          paths: repoFiles
            .filter((p) => p.startsWith(`${dir}/`))
            .map((p) => p.slice(dir.length + 1)),
        }),
      );
  }
  if (failed) {
    console.error(`\n${failed} finding(s).`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
