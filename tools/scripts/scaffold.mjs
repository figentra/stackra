#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm new <kind> <name> …` — copies a template from tools/scaffold/templates into the repo, replaces the
 *          six tokens ({{NAME}} {{PASCAL}} {{TITLE}} {{DESCRIPTION}} {{PORT}} {{CATEGORY}}) in contents and path
 *          names, copies the root LICENSE into every new workspace member, then formats the result with oxfmt.
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
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const TEMPLATES = join(ROOT, "tools/scaffold/templates");

export const CATEGORIES = [
  "foundation",
  "application",
  "communication",
  "cross-cutting",
  "data",
  "developer",
  "experience",
  "runtime",
  "security",
  "state",
];

/** kind → template dir, destination (relative to root), and whether it is a workspace member. */
const KINDS = {
  domain: { tpl: "packages/domain", dest: (n, c) => `packages/${c}/${n}`, category: true },
  platform: { tpl: "packages/platform", dest: (n, c) => `packages/${c}/${n}`, category: true },
  lib: { tpl: "packages/lib", dest: (n, c) => `packages/${c}/${n}`, category: true },
  tooling: { tpl: "packages/tooling", dest: (n) => `packages/tooling/${n}` },
  "app-vite": { tpl: "apps/vite", dest: (n) => `apps/${n}`, ports: [3710, 3799] },
  "app-expo": { tpl: "apps/expo", dest: (n) => `apps/${n}`, noHyphen: true },
  "app-docs": { tpl: "apps/docs", dest: (n) => `apps/${n}`, ports: [3334, 3399] },
  "app-next": { tpl: "apps/next", dest: (n) => `apps/${n}`, ports: [3710, 3799] },
  service: { tpl: "services/encore", dest: (n) => `services/src/${n}`, unit: true },
};
export const KIND_NAMES = Object.keys(KINDS);

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
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

/**
 * Renders a template. Returns the destination dir and the relative file list. With `dryRun` nothing is written
 * and `format` is skipped. `root` is the repo root (injectable for tests); templates always come from this repo.
 */
export function scaffold({
  kind,
  name,
  root = ROOT,
  category,
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
      `invalid name "${name}" — app-expo names cannot contain hyphens (Android package segment)`,
    );
  if (spec.category && !CATEGORIES.includes(category))
    throw new Error(`--category is required, one of: ${CATEGORIES.join(", ")}`);

  const rel = spec.dest(name, category);
  const dest = join(root, rel);
  if (existsSync(dest)) throw new Error(`${rel} already exists`);

  const tokens = {
    NAME: name,
    PASCAL: pascal(name),
    TITLE: title ?? titleCase(name),
    DESCRIPTION: description,
    PORT: String(port ?? (spec.ports ? freePort(root, spec.ports) : "")),
    CATEGORY: category ?? "",
  };
  const fill = (text, escape) =>
    text.replace(/\{\{(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY)\}\}/g, (_, k) =>
      escape && (k === "DESCRIPTION" || k === "TITLE")
        ? JSON.stringify(tokens[k]).slice(1, -1)
        : tokens[k],
    );

  const tplDir = join(TEMPLATES, spec.tpl);
  const files = [];
  for (const src of walk(tplDir)) {
    const out = fill(relative(tplDir, src), false);
    files.push(out);
    if (dryRun) continue;
    const target = join(dest, out);
    mkdirSync(dirname(target), { recursive: true });
    const json = /\.jsonc?$/.test(out);
    writeFileSync(target, fill(readFileSync(src, "utf8"), json));
  }
  if (!spec.unit) files.push("LICENSE");
  if (!dryRun) {
    if (!spec.unit) copyFileSync(join(ROOT, "LICENSE"), join(dest, "LICENSE"));
    if (format)
      execFileSync("pnpm", ["exec", "oxfmt", "--write", dest], { cwd: ROOT, stdio: "inherit" });
  }
  return { dest, rel, files: files.sort() };
}

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (["--category", "--description", "--title", "--port"].includes(a)) {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      opts[a.slice(2)] = argv[++i];
    } else if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
    else opts._.push(a);
  }
  return opts;
}

function main() {
  try {
    const {
      _: [kind, name, ...extra],
      port,
      ...opts
    } = parseArgs(process.argv.slice(2));
    if (!kind || !name || extra.length)
      throw new Error(
        `usage: pnpm new <kind> <name> [--category <c>] [--description "<text>"] [--title "<Title>"] [--port <n>] [--dry-run]\nkinds: ${KIND_NAMES.join(", ")}`,
      );
    const r = scaffold({ kind, name, ...opts, port: port && Number(port) });
    console.log(`${opts.dryRun ? "Would create" : "Created"} ${r.rel}:`);
    for (const f of r.files) console.log(`  ${f}`);
    if (!opts.dryRun) console.log("\nNext: pnpm install, then pnpm verify");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
