#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm new <kind> <name> …` — copies a template from tools/scaffold/templates into a monorepo (this one,
 *          or another with `--repo <path>`), replaces the tokens ({{NAME}} {{PASCAL}} {{TITLE}} {{DESCRIPTION}}
 *          {{PORT}} {{CATEGORY}} {{ENTRIES}}) in contents and path names, adds the chosen optional package entries
 *          and, with `--data`, the module's database folders, writes a package's `exports` and `imports`, copies the
 *          target repo's LICENSE into the new member, writes the npm metadata, keywords, `stackra` field (with
 *          `--summary`) and turbo tags `pnpm validate` requires (ADR 0453 decision 11, amendment of 2026-10-27), then
 *          formats the result with oxfmt. Members come out in the
 *          programming model v3 shape (ADR 0294 rule R12, ADR 0295): `stackra.config.ts`, one root module, no
 *          authored `main.ts` or entry barrel.
 * Boundary: writes only the one new destination directory, then formats it.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0294.
 * Scope: tools/scaffold/templates/**; writes only the one new destination directory.
 * Owner: release-operations · Secrets: forbidden
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import {
  CATEGORY_NAMES,
  ENTRY_NAMES,
  OPTIONAL_ENTRY_NAMES,
  PACKAGE_FOLDERS,
  categoryOf,
  npmMetadataFor,
  rootModuleOf,
  tierFor,
  turboTagsFor,
} from "./structure.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const TEMPLATES = join(ROOT, "tools/scaffold/templates");

/** kind → template dir and destination (relative to the target repo root). */
const KINDS = {
  service: { tpl: "services/service", dest: (n) => `services/${n}`, runtimes: ["node"] },
  package: {
    tpl: "packages/package",
    dest: (n, c) => `packages/${c}/${n}`,
    category: true,
    data: true,
    // `.` and `./node` always come; `entryRuntimes` adds the picked optional entries.
    runtimes: ["isomorphic", "node"],
  },
  tooling: { tpl: "packages/tooling", dest: (n) => `packages/tooling/${n}`, runtimes: ["node"] },
  "app:console": {
    tpl: "apps/console",
    dest: (n) => `apps/${n}`,
    ports: [3710, 3799],
    runtimes: ["browser"],
  },
  "app:mobile": {
    tpl: "apps/mobile",
    dest: (n) => `apps/${n}`,
    noHyphen: true,
    runtimes: ["react-native"],
  },
  "app:desktop": { tpl: "apps/desktop", dest: (n) => `apps/${n}`, runtimes: ["node", "browser"] },
  "app:docs": {
    tpl: "apps/docs",
    dest: (n) => `apps/${n}`,
    ports: [3334, 3399],
    runtimes: ["browser"],
  },
};

/** The runtime an optional package entry adds (`stackra.runtimes`, ADR 0453 decision 11). */
const ENTRY_RUNTIMES = { react: "browser", native: "react-native" };
/** The runtime vocabulary of the contract header, in `stackra.runtimes` order. */
const RUNTIME_ORDER = ["isomorphic", "node", "browser", "worker", "react-native"];

/**
 * The npm metadata, keywords and `stackra` field of a new member (ADR 0453 decision 11, amendment of 2026-10-27), and
 * the turbo tags they imply. `pnpm validate` checks the same values.
 */
function memberMetadata({ rel, runtimes, summary, keywords = [] }) {
  const category = categoryOf(rel) ?? undefined;
  const tier = tierFor(rel).slice("tier:".length);
  const ordered = RUNTIME_ORDER.filter((r) => runtimes.includes(r));
  const stackra = {
    kind: "package",
    tier,
    ...(category && { category }),
    runtimes: ordered,
    summary,
  };
  return {
    fields: {
      keywords: [...new Set(["stackra", ...(category ? [category] : []), ...keywords])],
      ...npmMetadataFor(rel),
      stackra,
    },
    tags: turboTagsFor(stackra),
  };
}
export const KIND_NAMES = Object.keys(KINDS);

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
// Spaces tolerated: oxfmt rewrites `{{TITLE}}` inside JSX text to `{{ TITLE }}`.
const TOKEN_RE = /\{\{\s*(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY|ENTRIES)\s*\}\}/g;
/** Template files copied byte for byte: images, fonts and documents hold no tokens and a text round trip corrupts them. */
export const BINARY_RE = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|pdf)$/i;
const pascal = (n) => n.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const titleCase = (n) =>
  n.replace(/(^|-)([a-z0-9])/g, (_, s, c) => (s ? " " : "") + c.toUpperCase());

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** Next free port in [lo, hi] not used by any `--port <n>` in root/apps/*\/package.json. */
function freePort(root, [lo, hi]) {
  const used = new Set();
  const appsDir = join(root, "apps");
  if (existsSync(appsDir))
    for (const d of readdirSync(appsDir)) {
      const f = join(appsDir, d, "package.json");
      if (existsSync(f))
        for (const m of readFileSync(f, "utf8").matchAll(/--port (\d+)/g)) used.add(Number(m[1]));
    }
  for (let p = lo; p <= hi; p++) if (!used.has(p)) return p;
  throw new Error(`no free port in ${lo}-${hi}`);
}

/** `"none"`, `""`, an array or a comma list → the optional entries named, in exports order; the others always come. */
export function parseEntries(value = []) {
  const list = (Array.isArray(value) ? value : String(value).split(","))
    .map((e) => e.trim())
    .filter((e) => e && e !== "none");
  for (const e of list)
    if (!ENTRY_NAMES.includes(e))
      throw new Error(
        `unknown entry "${e}" — optional: ${OPTIONAL_ENTRY_NAMES.join(", ")} (core, contracts, node and testing always come)`,
      );
  return OPTIONAL_ENTRY_NAMES.filter((e) => list.includes(e));
}

/** ADR 0025 export shape for one entry; core is `.` built as `index`. */
const exportOf = (out, src) => ({
  "@stackra/source": `./${src}`,
  types: `./dist/${out}.d.mts`,
  default: `./dist/${out}.mjs`,
});

/**
 * The exports of a new package: `[subpath, build name, source]`. No barrel is authored (ADR 0294 decision 15), so each
 * export names its entry's one public file until gen writes the barrels (STA-339); entries with no file yet have none.
 * `.` names the config class, which a host subclasses (ADR 0294 decision 19); `core/` has no file yet.
 */
const packageExports = (dir) => [
  [".", "index", `src/config/${dir.split("/").at(-1)}.config.ts`],
  ["./node", "node", rootModuleOf(dir)],
];

/** A `#` alias target with the extension fallbacks `bundler` resolution needs (ADR 0233). */
const aliasOf = (dir) => [`./${dir}/*`, `./${dir}/*.ts`, `./${dir}/*.tsx`, `./${dir}/*/index.ts`];

/** A package's `imports` map: one alias per `src/` folder it has (ADR 0294 decision 15), and gen's `#stackra/*`. */
const packageImports = (picked) => ({
  ...Object.fromEntries(
    PACKAGE_FOLDERS.map((f) => f.folder.split("/")[0])
      .filter((f) => !OPTIONAL_ENTRY_NAMES.includes(f) || picked.includes(f))
      .map((f) => [`#${f}/*`, aliasOf(`src/${f}`)]),
  ),
  "#stackra/*": aliasOf(".stackra/gen"),
});

/**
 * Renders a template. Returns the destination dir and the relative file list. With `dryRun` nothing is written
 * and `format` is skipped. `root` is the target repo root (`--repo`); templates always come from this repo.
 */
export function scaffold({
  kind,
  name,
  root = ROOT,
  category,
  entries = [],
  data = false,
  description,
  summary,
  keywords = [],
  title,
  port,
  dryRun = false,
  format = true,
}) {
  const spec = KINDS[kind];
  if (!spec) throw new Error(`unknown kind "${kind}" — one of: ${KIND_NAMES.join(", ")}`);
  if (!NAME_RE.test(name ?? ""))
    throw new Error(
      `invalid name "${name}" — kebab-case, lowercase letters and digits, starts with a letter`,
    );
  if (spec.noHyphen && name.includes("-"))
    throw new Error(
      `invalid name "${name}" — ${kind} names cannot contain hyphens (Android package segment)`,
    );
  if (data && !spec.data) throw new Error(`--data applies to package only, not ${kind}`);
  if (spec.category && !CATEGORY_NAMES.includes(category))
    throw new Error(`--category is required, one of: ${CATEGORY_NAMES.join(", ")}`);
  if (!description?.trim())
    throw new Error(
      '--description is required: one sentence, for example --description "Retries with backoff." It becomes the package.json description and opens README.md and AGENTS.md',
    );
  if (!summary?.trim() || summary.trim() === description.trim())
    throw new Error(
      "--summary is required: one sentence for agents on when to reach for the member, not the description (package.json stackra.summary, ADR 0453 decision 11)",
    );
  if (!existsSync(root) || !statSync(root).isDirectory())
    throw new Error(`--repo ${root} is not a directory`);
  const picked = kind === "package" ? parseEntries(entries) : [];

  const rel = spec.dest(name, category);
  const dest = join(root, rel);
  if (existsSync(dest)) throw new Error(`${rel} already exists`);

  const exported = kind === "package" ? packageExports(rel) : [];
  const tokens = {
    NAME: name,
    PASCAL: pascal(name),
    TITLE: title ?? titleCase(name),
    DESCRIPTION: description,
    PORT: String(port ?? (spec.ports ? freePort(root, spec.ports) : "")),
    CATEGORY: category ?? "",
    ENTRIES: exported
      .map(([, out, src]) => `${JSON.stringify(out)}: ${JSON.stringify(src)}`)
      .join(", "),
  };
  const fill = (text, escape) =>
    text.replace(TOKEN_RE, (_, k) =>
      escape && (k === "DESCRIPTION" || k === "TITLE")
        ? JSON.stringify(tokens[k]).slice(1, -1)
        : tokens[k],
    );

  const sources = [
    join(TEMPLATES, spec.tpl),
    ...picked.map((e) => join(TEMPLATES, "packages/entries", e)),
    ...(data ? [join(TEMPLATES, "packages/data")] : []),
  ];
  const files = [];
  for (const tplDir of sources)
    for (const src of walk(tplDir)) {
      const out = fill(relative(tplDir, src), false);
      files.push(out);
      if (dryRun) continue;
      const target = join(dest, out);
      mkdirSync(dirname(target), { recursive: true });
      // Images and fonts hold no tokens and would be corrupted by a text round trip.
      if (BINARY_RE.test(out)) copyFileSync(src, target);
      else writeFileSync(target, fill(readFileSync(src, "utf8"), /\.jsonc?$/.test(out)));
    }
  const licensed = kind === "package" || kind === "tooling";
  if (licensed) files.push("LICENSE");
  if (!dryRun) {
    const file = join(dest, "package.json");
    const pkg = JSON.parse(readFileSync(file, "utf8"));
    if (kind === "package") {
      pkg.exports = {
        ...Object.fromEntries(exported.map(([key, out, src]) => [key, exportOf(out, src)])),
        // Static files at the package root (ADR 0177 and ADR 0234, amendments of 2026-10-21).
        "./assets/*": "./assets/*",
      };
      pkg.imports = packageImports(picked);
    }
    const { fields, tags } = memberMetadata({
      rel,
      runtimes: [...spec.runtimes, ...picked.map((e) => ENTRY_RUNTIMES[e]).filter(Boolean)],
      summary: summary.trim(),
      keywords: (Array.isArray(keywords) ? keywords : String(keywords).split(","))
        .map((k) => k.trim())
        .filter(Boolean),
    });
    // oxfmt sorts the keys into package.json order when it formats the member.
    Object.assign(pkg, fields);
    writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
    const turbo = join(dest, "turbo.jsonc");
    writeFileSync(
      turbo,
      readFileSync(turbo, "utf8").replace(
        /"tags"\s*:\s*\[[^\]]*\]/,
        `"tags": ${JSON.stringify(tags)}`,
      ),
    );
    const license = !licensed
      ? undefined
      : existsSync(join(root, "LICENSE"))
        ? join(root, "LICENSE")
        : join(ROOT, "LICENSE");
    if (license) copyFileSync(license, join(dest, "LICENSE"));
    if (format)
      execFileSync("pnpm", ["exec", "oxfmt", "--write", dest], { cwd: ROOT, stdio: "inherit" });
  }
  return { dest, rel, files: files.sort() };
}

const VALUE_FLAGS = [
  "--category",
  "--description",
  "--summary",
  "--keywords",
  "--title",
  "--port",
  "--entries",
  "--repo",
];

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--data") opts.data = true;
    else if (VALUE_FLAGS.includes(a)) {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      opts[a.slice(2)] = argv[++i];
    } else if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
    else opts._.push(a);
  }
  return opts;
}

async function main() {
  try {
    const {
      _: [kind, name, ...extra],
      port,
      repo,
      ...opts
    } = parseArgs(process.argv.slice(2));
    if (!kind || !name || extra.length)
      throw new Error(
        `usage: pnpm new <kind> <name> --description "<one sentence>" --summary "<when an agent reaches for it>" [--keywords a,b,c] [--category <c>] [--entries ${OPTIONAL_ENTRY_NAMES.join(",")}|none] [--data] [--title "<Title>"] [--port <n>] [--repo <path>] [--dry-run]\nkinds: ${KIND_NAMES.join(", ")}`,
      );
    // The only prompt: optional package entries, asked on a terminal when --entries is absent.
    if (kind === "package" && opts.entries === undefined && process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      opts.entries = await rl.question(
        `Optional entries (${OPTIONAL_ENTRY_NAMES.join(",")}) [none]: `,
      );
      rl.close();
    }
    const r = scaffold({
      kind,
      name,
      ...opts,
      root: repo ? resolve(repo) : ROOT,
      port: port && Number(port),
    });
    console.log(`${opts.dryRun ? "Would create" : "Created"} ${r.rel}:`);
    for (const f of r.files) console.log(`  ${f}`);
    if (!opts.dryRun) console.log("\nNext: pnpm install, then pnpm verify");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
