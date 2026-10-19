#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the repository-shape gate run by `pnpm validate` (part of `pnpm verify`). Every workspace member uses
 *          catalog:/workspace: versions only, is named @stackra/*, declares exactly one turbo tier tag matching its
 *          directory, extends a @stackra/typescript-config preset, and depends on no forbidden package.
 *          Prints the findings and exits 1; prints nothing on success. Adapted from Figentra's checks 1–5.
 * Scope: every member listed by `pnpm -r list --json --depth -1`.
 * Owner: release-operations · Secrets: forbidden
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/** Architecture decisions enforced at the manifest level (~/.claude/rules/not-built-yet.md). */
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

/** Strips // and /* *\/ comments and trailing commas so a .json/.jsonc config parses. */
function readJsonc(path) {
  const text = readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"])\/\/.*$/gm, "$1")
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(text);
}

/**
 * Findings for one member. `files` holds the parsed turbo.json / tsconfig.json (undefined when absent), so the
 * rules are testable without touching the disk.
 */
export function check({ dir, pkg, turbo, tsconfig }) {
  const out = [];
  if (pkg.name !== "stackra" && !pkg.name?.startsWith("@stackra/"))
    out.push(`package name ${pkg.name} is not @stackra/*`);

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
  if (!turbo) out.push("turbo.json missing");
  else {
    if (!turbo.extends?.includes("//")) out.push('turbo.json does not extend "//"');
    const tags = (turbo.tags ?? []).filter((t) => t.startsWith("tier:"));
    if (tags.length !== 1 || tags[0] !== tier)
      out.push(`turbo.json tier tags ${JSON.stringify(tags)} — expected exactly ["${tier}"]`);
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
  if (pkg.license !== "UNLICENSED") out.push('package.json license must be "UNLICENSED"');
  if (tierFor(dir) === "tier:lib") {
    if (pkg.sideEffects !== false) out.push("package.json sideEffects must be false");
    for (const t of exportTargets(pkg.exports))
      if (!t.startsWith("./src/") && !/\.jsonc?$/.test(t))
        out.push(`exports target ${t} must start with ./src/ or end with .json/.jsonc`);
  }
  return out;
}

function exportTargets(e) {
  if (typeof e === "string") return [e];
  return e && typeof e === "object" ? Object.values(e).flatMap(exportTargets) : [];
}

/** Findings for an Encore service unit directory (services/src/<dir>). */
export function checkServiceUnit({ files, agents }) {
  const out = [];
  for (const f of ["encore.service.ts", "README.md", "AGENTS.md"])
    if (!files.includes(f)) out.push(`${f} missing`);
  if (files.includes("AGENTS.md") && !/^## PII/m.test(agents ?? ""))
    out.push('AGENTS.md has no "## PII" section');
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
  const servicesSrc = join(ROOT, "services/src");
  if (existsSync(servicesSrc))
    for (const d of readdirSync(servicesSrc))
      if (statSync(join(servicesSrc, d)).isDirectory())
        report(
          `services/src/${d}`,
          checkServiceUnit({
            files: readdirSync(join(servicesSrc, d)),
            agents: read(join(servicesSrc, d), "AGENTS.md"),
          }),
        );
  for (const { path } of members) {
    const dir = relative(ROOT, path);
    const at = (f) => (existsSync(join(path, f)) ? readJsonc(join(path, f)) : undefined);
    const pkg = JSON.parse(readFileSync(join(path, "package.json"), "utf8"));
    report(
      dir,
      check({
        dir,
        pkg,
        turbo: dir === "" ? undefined : at("turbo.json"),
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
  }
  if (failed) {
    console.error(`\n${failed} finding(s).`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
