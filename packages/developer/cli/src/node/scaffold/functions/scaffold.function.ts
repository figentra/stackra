/**
 * Stackra file contract:
 * Purpose: `scaffold(options)`, renders a member from `tools/scaffold/templates` into a monorepo (the one holding the
 *          templates, or another with `root`): replaces the tokens ({{NAME}} {{PASCAL}} {{TITLE}} {{DESCRIPTION}}
 *          {{PORT}} {{CATEGORY}} {{ENTRIES}}) in contents and path names, adds the chosen optional package entries and,
 *          with `data`, the module's database folders, writes a package's `exports` and, but for a tooling preset, the
 *          generated `imports` map of the folders it rendered (`importsMap`, STA-2072), copies the target repo's
 *          LICENSE, writes the npm metadata, keywords, `stackra` field and turbo tags `pnpm validate` requires (ADR 0453
 *          decision 11, amendment of 2026-10-27), then formats the result with oxfmt. Members come out in the
 *          programming model v3 shape (ADR 0294 rule R12, ADR 0295) (moved from `tools/scripts/scaffold.mjs`).
 * Boundary: writes only the one new destination directory, then formats it; with `dryRun` writes nothing.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0233 (decision 1); ADR 0294; ADR 0453 (decision 11).
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
import { dirname, join, relative } from "node:path";

import {
  CATEGORY_NAMES,
  categoryOf,
  npmMetadataFor,
  rootModuleOf,
  tierFor,
  turboTagsFor,
} from "@stackra/repo-checks/node";

import { importsMap } from "#node/functions/imports-map.function";
import { sorted } from "#node/functions/sorted.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { BINARY_RE } from "#node/scaffold/constants/binary-re.constant";
import { SCAFFOLD_KINDS } from "#node/scaffold/constants/scaffold-kinds.constant";
import { parseEntries } from "#node/scaffold/functions/parse-entries.function";
import type { ScaffoldOptions } from "#node/scaffold/types/scaffold-options.type";

/** The runtime an optional package entry adds (`stackra.runtimes`, ADR 0453 decision 11). */
const ENTRY_RUNTIMES: Readonly<Record<string, string>> = {
  react: "browser",
  native: "react-native",
};
/** The runtime vocabulary of the contract header, in `stackra.runtimes` order. */
const RUNTIME_ORDER = ["isomorphic", "node", "browser", "worker", "react-native"];

/**
 * The npm metadata, keywords and `stackra` field of a new member (ADR 0453 decision 11, amendment of 2026-10-27), and
 * the turbo tags they imply. `pnpm validate` checks the same values.
 */
function memberMetadata({
  rel,
  runtimes,
  summary,
  keywords = [],
}: {
  rel: string;
  runtimes: readonly string[];
  summary: string;
  keywords?: readonly string[];
}): { fields: Record<string, unknown>; tags: string[] } {
  const category = categoryOf(rel) ?? undefined;
  const tier = (tierFor(rel) ?? "").slice("tier:".length);
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

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
// Spaces tolerated: oxfmt rewrites `{{TITLE}}` inside JSX text to `{{ TITLE }}`.
const TOKEN_RE = /\{\{\s*(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY|ENTRIES)\s*\}\}/g;
const pascal = (n: string): string =>
  n.replaceAll(/(^|-)([a-z0-9])/g, (_, __: string, c: string) => c.toUpperCase());
const titleCase = (n: string): string =>
  n.replaceAll(/(^|-)([a-z0-9])/g, (_, s: string, c: string) => (s ? " " : "") + c.toUpperCase());

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/** Next free port in [lo, hi] not used by any `--port <n>` in root/apps/*\/package.json. */
function freePort(root: string, [lo, hi]: readonly [number, number]): number {
  const used = new Set<number>();
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

/** ADR 0025 export shape for one entry; core is `.` built as `index`. */
const exportOf = (out: string, src: string): Record<string, string> => ({
  "@stackra/source": `./${src}`,
  types: `./dist/${out}.d.mts`,
  default: `./dist/${out}.mjs`,
});

/**
 * The exports of a new package: `[subpath, build name, source]`. No barrel is authored (ADR 0294 decision 15), so each
 * export names its entry's one public file until gen writes the barrels (STA-339); entries with no file yet have none.
 * `.` names the config class, which a host subclasses (ADR 0294 decision 19); `core/` has no file yet.
 */
const packageExports = (dir: string): [string, string, string][] => [
  [".", "index", `src/config/${dir.split("/").at(-1)}.config.ts`],
  ["./node", "node", rootModuleOf(dir) ?? ""],
];

/**
 * Renders a template and returns the destination dir and the relative file list. With `dryRun` nothing is written and
 * `format` is skipped. `root` is the target repo root; templates always come from `home`.
 *
 * @param options - the kind, name, target and flags.
 * @throws Error on an unknown kind, a bad name, a missing description, summary or category, or an existing folder.
 * @example
 * scaffold({ kind: "app:docs", name: "handbook", description: "A handbook.", summary: "Use it for docs.", dryRun: true });
 */
export function scaffold({
  kind,
  name,
  home = workspaceRoot(process.cwd()),
  root = home,
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
}: ScaffoldOptions): { dest: string; rel: string; files: string[] } {
  const spec = SCAFFOLD_KINDS[kind];
  if (!spec)
    throw new Error(`unknown kind "${kind}" — one of: ${Object.keys(SCAFFOLD_KINDS).join(", ")}`);
  if (!NAME_RE.test(name ?? ""))
    throw new Error(
      `invalid name "${name}" — kebab-case, lowercase letters and digits, starts with a letter`,
    );
  if (spec.noHyphen && name.includes("-"))
    throw new Error(
      `invalid name "${name}" — ${kind} names cannot contain hyphens (Android package segment)`,
    );
  if (data && !spec.data) throw new Error(`--data applies to package only, not ${kind}`);
  if (spec.category && !CATEGORY_NAMES.includes(category ?? ""))
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
  const templates = join(home, "tools/scaffold/templates");

  const rel = spec.dest(name, category);
  const dest = join(root, rel);
  if (existsSync(dest)) throw new Error(`${rel} already exists`);

  const exported = kind === "package" ? packageExports(rel) : [];
  const tokens: Record<string, string> = {
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
  const fill = (text: string, escape: boolean): string =>
    text.replace(TOKEN_RE, (_, k: string) =>
      escape && (k === "DESCRIPTION" || k === "TITLE")
        ? JSON.stringify(tokens[k]).slice(1, -1)
        : (tokens[k] ?? ""),
    );

  const sources = [
    join(templates, spec.tpl),
    ...picked.map((e) => join(templates, "packages/entries", e)),
    ...(data ? [join(templates, "packages/data")] : []),
  ];
  const files: string[] = [];
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
    const pkg = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
    if (kind === "package") {
      pkg["exports"] = {
        ...Object.fromEntries(exported.map(([key, out, src]) => [key, exportOf(out, src)])),
        // Static files at the package root (ADR 0177 and ADR 0234, amendments of 2026-10-21).
        "./assets/*": "./assets/*",
      };
    }
    // From the folders just rendered, the map `stackra validate --repository` expects (STA-2072).
    if (kind !== "tooling") pkg["imports"] = importsMap(dest);
    const { fields, tags } = memberMetadata({
      rel,
      runtimes: [
        ...spec.runtimes,
        ...picked.map((e) => ENTRY_RUNTIMES[e]).filter((r): r is string => Boolean(r)),
      ],
      summary: summary.trim(),
      keywords: (Array.isArray(keywords) ? keywords : String(keywords).split(","))
        .map((k: string) => k.trim())
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
        : join(home, "LICENSE");
    if (license) copyFileSync(license, join(dest, "LICENSE"));
    if (format)
      execFileSync("pnpm", ["exec", "oxfmt", "--write", dest], { cwd: home, stdio: "inherit" });
  }
  return { dest, rel, files: sorted(files) };
}
