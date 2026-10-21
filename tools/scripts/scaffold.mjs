#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm new <kind> <name> …` — copies a template from tools/scaffold/templates into a monorepo (this one,
 *          or another with `--repo <path>`), replaces the tokens ({{NAME}} {{PASCAL}} {{TITLE}} {{DESCRIPTION}}
 *          {{PORT}} {{CATEGORY}} {{ENTRIES}}) in contents and path names, adds the chosen package entries, copies
 *          the target repo's LICENSE into the new member, then formats the result with oxfmt. Member shapes:
 *          ADR 0126.
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
import { CATEGORY_NAMES, ENTRY_NAMES } from "./structure.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const TEMPLATES = join(ROOT, "tools/scaffold/templates");

/** kind → template dir and destination (relative to the target repo root). */
const KINDS = {
  service: { tpl: "services/service", dest: (n) => `services/${n}` },
  package: { tpl: "packages/package", dest: (n, c) => `packages/${c}/${n}`, category: true },
  tooling: { tpl: "packages/tooling", dest: (n) => `packages/tooling/${n}` },
  "app:console": { tpl: "apps/console", dest: (n) => `apps/${n}`, ports: [3710, 3799] },
  "app:mobile": { tpl: "apps/mobile", dest: (n) => `apps/${n}`, noHyphen: true },
  "app:desktop": { tpl: "apps/desktop", dest: (n) => `apps/${n}` },
  "app:docs": { tpl: "apps/docs", dest: (n) => `apps/${n}`, ports: [3334, 3399] },
};
export const KIND_NAMES = Object.keys(KINDS);

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
// Spaces tolerated: oxfmt rewrites `{{TITLE}}` inside JSX text to `{{ TITLE }}`.
const TOKEN_RE = /\{\{\s*(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY|ENTRIES)\s*\}\}/g;
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

/** `"none"`, `""`, an array or a comma list → validated entry names in exports order. */
export function parseEntries(value = []) {
  const list = (Array.isArray(value) ? value : String(value).split(","))
    .map((e) => e.trim())
    .filter((e) => e && e !== "none");
  for (const e of list)
    if (!ENTRY_NAMES.includes(e))
      throw new Error(
        `unknown entry "${e}" — any of: ${ENTRY_NAMES.join(", ")} (core "." is always there)`,
      );
  return ENTRY_NAMES.filter((e) => list.includes(e));
}

/** ADR 0025 export shape for one entry; core is `.` built as `index`. */
const exportOf = (out, src) => ({
  "@stackra/source": `./${src}`,
  types: `./dist/${out}.d.mts`,
  default: `./dist/${out}.mjs`,
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
  description = "TODO: one sentence.",
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
  if (spec.category && !CATEGORY_NAMES.includes(category))
    throw new Error(`--category is required, one of: ${CATEGORY_NAMES.join(", ")}`);
  if (!existsSync(root) || !statSync(root).isDirectory())
    throw new Error(`--repo ${root} is not a directory`);
  const picked = kind === "package" ? parseEntries(entries) : [];

  const rel = spec.dest(name, category);
  const dest = join(root, rel);
  if (existsSync(dest)) throw new Error(`${rel} already exists`);

  const built = [["index", "src/core/index.ts"], ...picked.map((e) => [e, `src/${e}/index.ts`])];
  const tokens = {
    NAME: name,
    PASCAL: pascal(name),
    TITLE: title ?? titleCase(name),
    DESCRIPTION: description,
    PORT: String(port ?? (spec.ports ? freePort(root, spec.ports) : "")),
    CATEGORY: category ?? "",
    ENTRIES: built.map(([out, src]) => `${JSON.stringify(out)}: ${JSON.stringify(src)}`).join(", "),
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
  ];
  const files = [];
  for (const tplDir of sources)
    for (const src of walk(tplDir)) {
      const out = fill(relative(tplDir, src), false);
      files.push(out);
      if (dryRun) continue;
      const target = join(dest, out);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, fill(readFileSync(src, "utf8"), /\.jsonc?$/.test(out)));
    }
  const licensed = kind === "package" || kind === "tooling";
  if (licensed) files.push("LICENSE");
  if (!dryRun) {
    if (kind === "package") {
      const file = join(dest, "package.json");
      const pkg = JSON.parse(readFileSync(file, "utf8"));
      pkg.exports = {
        ".": exportOf("index", "src/core/index.ts"),
        ...Object.fromEntries(picked.map((e) => [`./${e}`, exportOf(e, `src/${e}/index.ts`)])),
        "./resources/*": "./resources/*",
      };
      writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
    }
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

const VALUE_FLAGS = ["--category", "--description", "--title", "--port", "--entries", "--repo"];

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
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
        `usage: pnpm new <kind> <name> [--category <c>] [--entries ${ENTRY_NAMES.join(",")}|none] [--description "<text>"] [--title "<Title>"] [--port <n>] [--repo <path>] [--dry-run]\nkinds: ${KIND_NAMES.join(", ")}`,
      );
    // The only prompt: package entries, asked on a terminal when --entries is absent.
    if (kind === "package" && opts.entries === undefined && process.stdin.isTTY) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      opts.entries = await rl.question(`Entries besides core (${ENTRY_NAMES.join(",")}) [none]: `);
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
