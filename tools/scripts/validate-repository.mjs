#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: the repository-shape gate run by `pnpm validate` (part of `pnpm verify`). Every workspace member uses
 *          catalog:/workspace: versions only, is named by placement (packages @stackra/<name>, apps @figentra/<dir>, services @figentra/service-<dir>), declares exactly one turbo tier tag matching its
 *          directory, extends a @stackra/typescript-config preset, and depends on no forbidden package.
 *          A service holds no Encore file (ADR 0126) and is either v2 (`src/main.ts` and `stackra.module`, ADR 0090)
 *          or v3 (`stackra.config.ts` and its root module, ADR 0294 R12) until STA-344 (`isV2Service`).
 *          Every test file anywhere in the repository sits directly in a __tests__/ folder (ADR 0022).
 *          Every JSON config is .jsonc unless its reader cannot take one (MUST_STAY_JSON).
 *          Repo-owned YAML has no flow mappings (block style; checkYamlFlowMaps).
 *          Member TS imports carry no file extension and climb at most one folder (checkImports, ADR 0233).
 *          Prints the findings and exits 1; prints nothing on success. Adapted from Figentra's checks 1–5.
 * Scope: every member listed by `pnpm -r list --json --depth -1`; test placement covers every non-ignored file.
 * Owner: release-operations · Secrets: forbidden
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, parseDocument, visit } from "yaml";
import { readJsonc } from "./jsonc.mjs";
import {
  FORBIDDEN_FILES,
  MEMBER_ROOT,
  rootModuleOf,
  SPEC_PATTERN,
  TEST_FILE_PATTERN,
} from "./structure.mjs";

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
  "next", // 0165: Next.js is rejected (no revival trigger); web is Vite with React Router 7
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

/**
 * HeroUI Pro and its wrapper package (ADR 0310, ADR 0197): only apps and the private `@stackra/ui-pro` may depend on
 * them, and only apps on `@stackra/ui-pro`; a free or published package never does (ADR 0165 decision 5).
 */
export const PRO_DEPENDENCIES = ["@heroui-pro/react", "heroui-native-pro", "@stackra/ui-pro"];

/** The one package that wraps HeroUI Pro; it stays private and unpublished (ADR 0310 decision 1). */
const PRO_WRAPPER = "@stackra/ui-pro";

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
  // ADR 0284: a Cloudflare Worker member is deployed like an app and reuses its tier.
  if (dir.startsWith("workers/")) return "tier:app";
  if (dir.startsWith("packages/tooling/")) return "tier:config";
  if (dir.startsWith("packages/")) return "tier:lib";
  if (dir.startsWith("services/")) return "tier:service";
  return "unknown";
}

/**
 * Expected npm name by placement: packages @stackra/<name>, apps @figentra/<dir>, services @figentra/service-<dir>,
 * workers @figentra/worker-<dir> (ADR 0284).
 */
export function expectedName(dir) {
  const base = dir.split("/").at(-1);
  if (dir.startsWith("apps/")) return `@figentra/${base}`;
  if (dir.startsWith("services/")) return `@figentra/service-${base}`;
  if (dir.startsWith("workers/")) return `@figentra/worker-${base}`;
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
      const isApp = dir.startsWith("apps/");
      if (
        PRO_DEPENDENCIES.includes(dep) &&
        !isApp &&
        (pkg.name !== PRO_WRAPPER || dep === PRO_WRAPPER)
      )
        out.push(
          `${field}.${dep} is HeroUI Pro: only apps and ${PRO_WRAPPER} may depend on it (ADR 0310)`,
        );
      if (version === "catalog:uniwind-pro" && !isApp)
        out.push(
          `${field}.${dep} is Uniwind Pro: only apps may use catalog:uniwind-pro (ADR 0310)`,
        );
      // peerDependencies state a compatible range for consumers; they cannot name a catalog.
      if (field === "peerDependencies") continue;
      if (!version.startsWith("catalog:") && !version.startsWith("workspace:"))
        out.push(
          `${field}.${dep} = "${version}" — add it to a catalog in pnpm-workspace.yaml and use catalog:<name>`,
        );
    }
  }

  if (pkg.name === PRO_WRAPPER && (pkg.private !== true || pkg.publishConfig))
    out.push(`${PRO_WRAPPER} must be "private": true with no publishConfig (ADR 0310)`);

  const tier = tierFor(dir);
  if (tier === null) return out;
  if (tier === "unknown")
    out.push("not under apps/*, packages/<category>/<name>, services/* or workers/*");
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
  // ADR 0195 decision 7: @stackra/* is MIT with a LICENSE; @figentra/* apps and services are UNLICENSED with none.
  const unlicensed = ["tier:app", "tier:service"].includes(tierFor(dir));
  for (const f of ["README.md", "AGENTS.md", "CHANGELOG.md", ...(unlicensed ? [] : ["LICENSE"])])
    if (!files.includes(f)) out.push(`${f} missing`);
  if (files.includes("AGENTS.md") && !/^## PII/m.test(agents ?? ""))
    out.push('AGENTS.md has no "## PII" section');
  if (unlicensed && files.includes("LICENSE")) out.push("LICENSE must not exist (ADR 0195)");
  if (!unlicensed && files.includes("LICENSE") && licenseText !== rootLicense)
    out.push("LICENSE differs from the root LICENSE");
  if (!pkg.description?.trim()) out.push("package.json has no description");
  const license = unlicensed ? "UNLICENSED" : "MIT";
  if (pkg.license !== license) out.push(`package.json license must be "${license}" (ADR 0195)`);
  if (tierFor(dir) === "tier:lib") {
    if (pkg.sideEffects !== false) out.push("package.json sideEffects must be false");
    out.push(...checkExports(pkg.exports));
    // ADR 0177 amendment 2026-10-21: @stackra/* publishes to npmjs, public, with provenance.
    // npm provenance rejects a package whose repository.url differs from the signing repository.
    if (
      pkg.repository?.url !== "git+https://github.com/figentra/stackra.git" ||
      !pkg.repository?.directory
    )
      out.push(
        'package.json repository must be { type: "git", url: "git+https://github.com/figentra/stackra.git", directory } (ADR 0177)',
      );
    const pc = pkg.publishConfig ?? {};
    // ADR 0310: the HeroUI Pro wrapper is never published, so it carries no publishConfig (`check` refuses one).
    if (
      pkg.name !== PRO_WRAPPER &&
      (pc.access !== "public" ||
        pc.provenance !== true ||
        pc.registry !== "https://registry.npmjs.org/")
    )
      out.push(
        'package.json publishConfig must be { "access": "public", "provenance": true, "registry": "https://registry.npmjs.org/" } (ADR 0177)',
      );
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
 * Transition until STA-344 converts services/example and services/health: a service with an authored `src/main.ts`
 * is the v2 shape (ADR 0126, root module named by `package.json` `stackra.module`, ADR 0090); one without is the v3
 * shape that `pnpm new service` writes (ADR 0294 rule R12). STA-344 deletes the v2 branch.
 */
export const isV2Service = (paths) => paths.includes("src/main.ts");

/**
 * Findings for a service member: plain TypeScript and no Encore file — Encore is generated into .stackra/encore
 * (ADRs 0091, 0124). A v2 service names an existing root module in `stackra.module`; a v3 service has
 * `stackra.config.ts` and `src/<dir>.module.ts` (existence only: the v3 shape checks are STA-338 and STA-340).
 * `paths` are the member's files relative to the member directory.
 */
export function checkService({ dir, pkg, paths }) {
  const out = [];
  if (isV2Service(paths)) {
    const module = pkg.stackra?.module;
    if (!module)
      out.push('package.json has no "stackra": { "module": "./src/<name>.module.ts" } (ADR 0090)');
    else if (!paths.includes(module.replace(/^\.\//, "")))
      out.push(`package.json stackra.module ${module} does not exist`);
  } else {
    for (const file of [MEMBER_ROOT.config, rootModuleOf(dir)])
      if (!paths.includes(file))
        out.push(
          `${file} missing (v3 service shape, ADR 0294 R12; a v2 service keeps src/main.ts until STA-344)`,
        );
  }
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
    /^packages\/tooling\/typescript\/src\/[\w-]+\.json$/,
    "tsconfig presets via package exports; comments allowed",
  ],
  [
    /^tools\/scaffold\/templates\/packages\/tooling\/src\/base\.json$/,
    "generic preset template: rename to .jsonc for a JSONC tool",
  ],
  [/^\.claude\/[\w.-]+\.json$/, "Claude Code settings/launch: fixed .json names"],
  [
    /^\.vscode\/(settings|extensions|launch|tasks)\.json$/,
    "VS Code reads these fixed names (JSONC inside)",
  ],
  [/^\.changeset\/config\.json$/, "@changesets/config JSON.parse on a fixed path"],
  [/^\.github\/branch-protection\.json$/, "GitHub REST API payload"],
  [/^\.github\/rulesets\/[\w-]+\.json$/, "GitHub REST ruleset payload (PUT …/rulesets/<id>)"],
  [
    /^tools\/schemas\/[\w-]+\.schema\.json$/,
    "JSON Schema documents: editors and validators fetch them by URL or path as JSON",
  ],
  [
    /^packages\/design-system\/tokens\/assets\/data\/[\w-]+\/[\w-]+\.json$/,
    "brand-kit token reports, vendored byte-for-byte; the theme tests JSON.parse them",
  ],
  [
    /^packages\/developer\/runway\/schema\/[\w-]+\.json$/,
    "runway JSON Schemas: shipped as @stackra/runway/schema/<kind>.json for editors and validators",
  ],
  [/(^|\/)src\/docs\.json$/, "Mintlify parses docs.json with JSON.parse"],
  [
    /(^|\/)([\w-]+\.)?stackra\.manifest\.json$/,
    "stackra gen writes the committed manifest as strict JSON (ADR 0294 R10); test fixtures copy it",
  ],
  [/(^|\/)(app|eas)\.json$/, "Expo/EAS: fixed names, rewritten by the expo/eas CLIs"],
  [/^\.specify\//, "spec-kit CLI output, read by its scripts with jq / python json"],
  [/^\.(agents|claude)\/skills\//, "vendored skills: upstream content"],
  [
    /(^|\/)assets\/lang\/[\w-]+\/[\w-]+\.json$/,
    "lang catalogues are assets/lang/<locale>/<namespace>.json by ADR 0305 (rule 1); @stackra/i18n reads JSON",
  ],
];

/**
 * JSONC files whose reader has no YAML support, each with the reader. Repo-owned config (read by tools/scripts)
 * is YAML; a .jsonc is allowed only where the tool cannot read YAML. A new entry names the reader.
 */
export const MUST_STAY_JSONC = [
  [/(^|\/)turbo\.jsonc$/, "Turborepo: turbo.json / turbo.jsonc only"],
  [
    /^\.oxlintrc\.jsonc$|^packages\/tooling\/oxlint\/src\/[\w-]+\.jsonc$/,
    "oxlint: JSON/JSONC or oxlint.config.ts",
  ],
  [/^\.oxfmtrc\.jsonc$/, "oxfmt: .oxfmtrc.json / .jsonc only"],
  [/^knip\.jsonc$/, "knip: JSON/JSONC or knip.ts"],
  [/^opencode\.jsonc$/, "OpenCode: opencode.json / .jsonc only"],
  [/(^|\/)wrangler\.jsonc$/, "Wrangler: wrangler.toml / .json / .jsonc only (ADR 0284)"],
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

/** Generated or vendored YAML the flow-map rule does not own. pnpm-workspace.yaml joins when STA-300 lands. */
const YAML_NOT_OWNED = [
  /^pnpm-lock\.yaml$/,
  /^pnpm-workspace\.yaml$/,
  /^\.specify\//,
  /^\.(agents|claude)\/(skills|reference)\//,
  /^\.old\//,
];

export const isRepoOwnedYaml = (p) =>
  /\.ya?ml$/.test(p) && !YAML_NOT_OWNED.some((re) => re.test(p));

/**
 * YAML standard (STA-299): repo-owned YAML has no flow mappings (`{ a: b }`); use a block mapping. Flow sequences
 * of plain scalars stay allowed, and so does the empty `{}` (it has no block form, e.g. `permissions: {}`).
 */
export function checkYamlFlowMaps(path, text) {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter });
  if (doc.errors.length)
    return [`${path}: not valid YAML (${doc.errors[0].message.split("\n")[0]})`];
  const out = [];
  visit(doc, {
    Map(_, node) {
      if (!node.flow || node.items.length === 0) return;
      const { line } = lineCounter.linePos(node.range[0]);
      out.push(`${path}:${line}: flow mapping; write a block mapping (YAML standard, STA-299)`);
    },
  });
  return out;
}

/**
 * ADR 0022: every `*.test.*` file sits directly in `__tests__/`; `.spec.*` is not used. Tier infixes (`.int`,
 * `.contract`, `.e2e`, `.load`) go before `.test` (TS1/TS2). No Storybook: `*.stories.*` is banned (ADR 0126).
 * `.old/` is archived code.
 */
export function checkTestPlacement(paths) {
  const out = [];
  for (const p of paths) {
    if (p.startsWith(".old/")) continue;
    for (const forbidden of FORBIDDEN_FILES)
      if (forbidden.pattern.test(p)) out.push(`${p}: ${forbidden.hint}`);
    if (!TEST_FILE_PATTERN.test(p)) continue;
    const parts = p.split("/");
    if (parts.at(-2) !== "__tests__")
      out.push(`${p}: test files go in a __tests__/ folder (ADR 0022)`);
    if (SPEC_PATTERN.test(parts.at(-1)))
      out.push(`${p}: name it <subject>.test.<ext>, not .spec (ADR 0022)`);
  }
  return out;
}

/** Import specifiers in TS source: `from "…"`, `import "…"`, `import("…")` and the vitest module helpers. */
const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|^\s*import\s+|\bimport\s*\(\s*|\bvi\.(?:mock|doMock|importActual)\(\s*)["']([^"'\n]+)["']/gm;
const TS_EXTENSION = /\.[cm]?[jt]sx?$/;
const DEEP_RELATIVE = /^(?:\.\.\/){2,}/;
/** Plain Node loads the tooling presets (they keep `./x.ts`); oxlint's fixtures break the rules on purpose. */
const IMPORTS_EXEMPT =
  /^(?:packages\/tooling\/|tools\/scaffold\/templates\/packages\/tooling\/)|\/__tests__\/fixtures\//;
export const isMemberSource = (p) =>
  /^(?:apps|packages|services|workers|tools\/scaffold\/templates)\/.+\.(?:ts|tsx|mts)$/.test(p) &&
  !IMPORTS_EXEMPT.test(p);

/**
 * ADR 0233 with the owner's rule of 2026-10-22: inside a member a TS import names no file extension (every preset
 * resolves with `bundler`, set in base.json) and climbs at most one folder (`./x`, `../x`); a deeper reach uses
 * the member's `#` alias from its package.json `imports` map. JSON imports and `?url`/`?raw` assets are untouched.
 */
export function checkImports(path, text) {
  const out = [];
  for (const [, spec] of text.matchAll(IMPORT_SPECIFIER)) {
    if (!spec.startsWith(".") && !spec.startsWith("#")) continue;
    if (TS_EXTENSION.test(spec))
      out.push(
        `${path}: import "${spec}" names a file extension; drop it (bundler resolution, ADR 0233)`,
      );
    if (DEEP_RELATIVE.test(spec))
      out.push(
        `${path}: import "${spec}" climbs two or more folders; use the member's # alias (ADR 0233)`,
      );
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
  for (const p of repoFiles.filter(isMemberSource))
    report("", checkImports(p, readFileSync(join(ROOT, p), "utf8")));
  for (const p of repoFiles.filter(isRepoOwnedYaml))
    report("", checkYamlFlowMaps(p, readFileSync(join(ROOT, p), "utf8")));
  // ADR 0024 decision 2: the brand marks carry their all-rights-reserved NOTICE (in the docs app since ADR 0302).
  if (!existsSync(join(ROOT, "apps/docs/src/assets/brand/NOTICE")))
    report("apps/docs", ["src/assets/brand/NOTICE missing (ADR 0024)"]);
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
          dir,
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
