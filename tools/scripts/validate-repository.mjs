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
 *          The runway JSON Schemas @stackra/runway ships are byte copies of tools/schemas (checkRunwaySchemas).
 *          Every runway.yaml passes the v3 schema of its kind and the root places each service member, through the
 *          built @stackra/runway (checkRunwayFiles, ADR 0296; unbuilt is a finding in CI and a notice locally).
 *          Repo-owned YAML has no flow mappings (block style; checkYamlFlowMaps).
 *          Member TS imports carry no file extension and climb at most one folder (checkImports, ADR 0233).
 *          An Expo app locks no orientation and asks for no full screen, and its code never sizes from the device
 *          (checkIosFormFactor and checkWindowSizing, STA-461).
 *          Prints the findings and exits 1; prints nothing on success. Adapted from Figentra's checks 1–5.
 * Scope: every member listed by `pnpm -r list --json --depth -1`; test placement covers every non-ignored file.
 * Owner: release-operations · Secrets: forbidden
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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
 * HeroUI Pro and its wrapper package (ADR 0310, ADR 0197): only apps and the private `@stackra-pro/ui` may depend on
 * them, and only apps on `@stackra-pro/ui`; a free or published package never does (ADR 0165 decision 5).
 */
export const PRO_DEPENDENCIES = ["@heroui-pro/react", "heroui-native-pro", "@stackra-pro/ui"];

/**
 * The one package that wraps HeroUI Pro. It publishes only to the restricted Keygen channel, never to npmjs (ADR 0310
 * decision 1 as amended by STA-447): `"private": true` keeps `pnpm publish` and changesets from sending it to npmjs, and
 * its `pnpm pack` tarball goes up through the Keygen CLI (STA-482), since Keygen's npm engine takes no `npm publish`.
 */
const PRO_WRAPPER = "@stackra-pro/ui";

/** Where the wrapper lives: the folder keeps its name while the package is `@stackra-pro/ui`. */
const PRO_WRAPPER_DIR = "packages/design-system/ui-pro";

/**
 * The restricted channel: Keygen's hosted npm engine for one account (ADR 0177 decision 2, ADR 0310). The Keygen
 * custom domain is named later (ADR 0290 decision 17), so the check takes any account and a move to that domain changes
 * this pattern and the package's `publishConfig.registry` together.
 */
const PRO_WRAPPER_REGISTRY = /^https:\/\/npm\.pkg\.keygen\.sh\/[\w-]+\/$/;

/** The last `files` entry, which keeps source maps out of the Pro tarball (ADR 0316 decision 2). */
const NO_SOURCE_MAPS = "!**/*.map";

/** A `files` entry that would pack the source folder: `src` in any spelling, or the whole package (`.`, `*`, `**`). */
const isSourceEntry = (entry) => /^(\.\/?|(\.\/)?\*{1,2}|(\.\/)?src(\/.*)?)$/.test(entry);

/** Every path a conditional `exports` value names, condition objects walked to their leaves. */
const exportTargets = (value) =>
  typeof value === "string"
    ? [value]
    : Object.values(value ?? {}).flatMap((inner) => exportTargets(inner));

/**
 * Findings for the Pro wrapper's publishing fields: private, the restricted registry, and the Pro tarball of ADR 0316
 * decision 2 (no `src` and, last, no source maps in `files`; packed exports for the same entries, on `dist` or
 * `assets` only, with no `@stackra/source`).
 */
function checkProWrapper(pkg) {
  const out = [];
  const publishConfig = pkg.publishConfig ?? {};
  const files = pkg.files ?? [];
  if (pkg.private !== true)
    out.push(`${PRO_WRAPPER} must be "private": true, so nothing publishes it to npmjs (ADR 0310)`);
  if (!PRO_WRAPPER_REGISTRY.test(publishConfig.registry ?? ""))
    out.push(
      `${PRO_WRAPPER} publishConfig.registry must be Keygen's npm engine, https://npm.pkg.keygen.sh/<account>/ (ADR 0310)`,
    );
  // A negated `files` entry only drops what the entries before it added, so the map exclusion comes last.
  if (files.some(isSourceEntry) || files.at(-1) !== NO_SOURCE_MAPS)
    out.push(
      `${PRO_WRAPPER} files must list no src and must end with "${NO_SOURCE_MAPS}": its tarball ships dist only (ADR 0316)`,
    );
  const entries = Object.keys(pkg.exports ?? {}).sort();
  const packed = Object.keys(publishConfig.exports ?? {}).sort();
  const targets = exportTargets(publishConfig.exports);
  if (
    packed.length === 0 ||
    packed.join() !== entries.join() ||
    JSON.stringify(publishConfig.exports).includes("@stackra/source") ||
    !targets.every((target) => /^\.\/(dist|assets)\//.test(target))
  )
    out.push(
      `${PRO_WRAPPER} publishConfig.exports must name every entry of exports, on dist or assets only, with no @stackra/source condition (ADR 0316)`,
    );
  return out;
}

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
  // The one Pro package lives in a `@stackra-pro` scope whose name is not its folder's (owner 6).
  if (dir === PRO_WRAPPER_DIR) return PRO_WRAPPER;
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

  if (pkg.name === PRO_WRAPPER) out.push(...checkProWrapper(pkg));

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
    // ADR 0310: the HeroUI Pro wrapper publishes only to the restricted channel, which `check` requires instead.
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
    /^packages\/foundation\/market-packs\/assets\/data\/packs\/[\w-]+\.json$/,
    "market packs: readPackAssets loads them with AssetLibrary.json and the pack hash is over the JSON document",
  ],
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

/** The runway kinds whose JSON Schema `@stackra/runway` ships; `tools/schemas` holds the canonical file (ADR 0296). */
export const RUNWAY_SCHEMA_KINDS = ["app", "root", "service"];

/**
 * `packages/developer/runway/schema/<kind>.json` is a byte copy of the canonical
 * `tools/schemas/runway-<kind>.schema.json`. `read(path)` returns a repository file's text, or undefined when absent.
 */
export function checkRunwaySchemas(read) {
  const out = [];
  for (const kind of RUNWAY_SCHEMA_KINDS) {
    const canonical = `tools/schemas/runway-${kind}.schema.json`;
    const copy = `packages/developer/runway/schema/${kind}.json`;
    if (read(copy) !== read(canonical))
      out.push(`${copy} differs from ${canonical}: run \`cp ${canonical} ${copy}\``);
  }
  return out;
}

/**
 * The runway kind a `runway.yaml` at `path` is read as (ADR 0296): the repository root is the root runway, an app or
 * Worker member root (or a scaffold app template) an app runway, a service member root (or a scaffold service
 * template) a service runway. Undefined anywhere else.
 */
export function runwayKindOf(path) {
  if (path === "runway.yaml") return "root";
  if (/^(?:apps|workers|tools\/scaffold\/templates\/apps)\/[^/]+\/runway\.yaml$/.test(path))
    return "app";
  if (/^(?:services|tools\/scaffold\/templates\/services)\/[^/]+\/runway\.yaml$/.test(path))
    return "service";
  return undefined;
}

/**
 * ADR 0296 enforcement (STA-598): each runway file parses as YAML with no repeated key and passes
 * `runway.parseRunway` for its kind; the root also passes `runway.checkPlacement` against `services`, the service
 * member keys. `runway` is the built `@stackra/runway` entry; `read(path)` returns a repository file's text.
 */
export function checkRunwayFiles({ files, read, runway, services }) {
  const out = [];
  for (const file of files) {
    const kind = runwayKindOf(file);
    if (!kind) {
      out.push(
        `${file}: no runway kind applies here; a runway file sits at the repository root or at a member root (ADR 0296)`,
      );
      continue;
    }
    const doc = parseDocument(read(file), { uniqueKeys: true });
    if (doc.errors.length) {
      out.push(`${file}: not valid YAML (${doc.errors[0].message.split("\n")[0]})`);
      continue;
    }
    let parsed;
    try {
      parsed = runway.parseRunway(kind, doc.toJS(), file);
    } catch (error) {
      if (!(error instanceof runway.RunwayInvalidError)) throw error;
      for (const { path, message } of error.issues)
        out.push(`${file}: ${path || "(document)"}: ${message}`);
      continue;
    }
    if (kind === "root")
      for (const { code, message } of runway.checkPlacement(parsed, services))
        out.push(`${file}: ${message} (${code})`);
  }
  return out;
}

/** `runway.yaml` (or a misnamed `runway.yml`) in repo-owned YAML; vendored and archived copies are not ours. */
export const isRunwayFile = (p) => isRepoOwnedYaml(p) && /(?:^|\/)runway\.ya?ml$/.test(p);

/**
 * The built `@stackra/runway` entry (its package `exports["."].default`), or undefined before it is built: its
 * sources use extensionless `#core/*` imports that plain Node cannot load (ADR 0233).
 */
async function loadRunway() {
  const dir = join(ROOT, "packages/developer/runway");
  const entry = join(
    dir,
    JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).exports["."].default,
  );
  return existsSync(entry) ? import(pathToFileURL(entry).href) : undefined;
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

/** An Expo app config: an app member's or the app templates' `app.json`. */
export const isExpoAppConfig = (p) =>
  /^(?:apps|tools\/scaffold\/templates\/apps)\/[^/]+\/app\.json$/.test(p);
/** An app's own source, where a screen lays itself out. */
const isAppSource = (p) =>
  /^(?:apps|tools\/scaffold\/templates\/apps)\/[^/]+\/src\/.+\.(?:ts|tsx)$/.test(p) &&
  !p.includes("/__tests__/");

/**
 * STA-461, the iPhone Duo and every resizable iOS window: an Expo app config locks no orientation (`orientation`
 * absent or `default`) and never asks for `ios.requireFullScreen`, so the app can take any size and rotation.
 */
export function checkIosFormFactor(path, text) {
  const expo = JSON.parse(text)?.expo;
  if (!expo) return [];
  const out = [];
  if (expo.orientation !== undefined && expo.orientation !== "default")
    out.push(
      `${path}: "orientation": "${expo.orientation}" locks the app; drop it or use "default" (STA-461)`,
    );
  if (expo.ios?.requireFullScreen === true)
    out.push(
      `${path}: "ios.requireFullScreen" refuses split views and resizable windows (STA-461)`,
    );
  return out;
}

/** STA-461: an app reads its size from the window it is given, never from the device or its model. */
export function checkWindowSizing(path, text) {
  return /\bDimensions\.get\(/.test(text)
    ? [
        `${path}: Dimensions.get reads the device, not the window; use useWindowDimensions (STA-461)`,
      ]
    : [];
}

async function main() {
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
  report(
    "",
    checkRunwaySchemas((p) => read(ROOT, p)),
  );
  const runwayFiles = repoFiles.filter(isRunwayFile);
  if (runwayFiles.length) {
    const runway = await loadRunway();
    // CI builds before it validates, so an unbuilt package there is a broken gate; locally it is only a notice.
    if (runway)
      report(
        "",
        checkRunwayFiles({
          files: runwayFiles,
          read: (p) => readFileSync(join(ROOT, p), "utf8"),
          runway,
          services: members
            .map(({ path }) => relative(ROOT, path))
            .filter((dir) => /^services\/[^/]+$/.test(dir))
            .map((dir) => dir.slice("services/".length)),
        }),
      );
    else if (process.env.CI)
      report("packages/developer/runway", [
        "not built, so no runway file was checked: build @stackra/runway before `pnpm validate`",
      ]);
    else
      console.warn(
        `validate: ${runwayFiles.length} runway file(s) not checked: @stackra/runway is not built (pnpm turbo run build --filter=@stackra/runway)`,
      );
  }
  for (const p of repoFiles.filter(isMemberSource))
    report("", checkImports(p, readFileSync(join(ROOT, p), "utf8")));
  for (const p of repoFiles.filter(isRepoOwnedYaml))
    report("", checkYamlFlowMaps(p, readFileSync(join(ROOT, p), "utf8")));
  for (const p of repoFiles.filter(isExpoAppConfig))
    report("", checkIosFormFactor(p, readFileSync(join(ROOT, p), "utf8")));
  for (const p of repoFiles.filter(isAppSource))
    report("", checkWindowSizing(p, readFileSync(join(ROOT, p), "utf8")));
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

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
