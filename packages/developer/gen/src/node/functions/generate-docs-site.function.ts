/**
 * Stackra file contract:
 * Purpose: `generateDocsSite`, the docs-site run of `generate`. Its two inputs (ADR 0514 amendment of 2026-11-09):
 *          - a docs app (a member with `src/config/docs.config.ts`): it imports the config, takes the one exported
 *            class and reads the fields of a new instance, and lists `src/` (reading the pages and snippets); the
 *            site is Fumadocs for a docs app that depends on `fumadocs-ui` (ADR 0514, STA-2026), else the Mintlify
 *            root;
 *          - a docs member (a member whose `package.json` has `"stackra": { "kind": "docs" }`): `readDocsMember`
 *            reads `docs.yaml`, the navigation of `content/**\/meta.json` and the files under `content/`; the site is
 *            always Fumadocs.
 *          Then it reads the committed manifests of the `apiReference` services, calls the pure `emitDocsSite`, and
 *          writes the site into `.stackra/site/`: changed files written, assets copied (from `src/`, or from
 *          `content/` for a docs member), and files the run no longer produces removed. A check run reports the
 *          refusals only: the site is gitignored, so nothing in it can be stale.
 * Boundary: writes only under `<member>/.stackra/site/`, never into `src/` or `content/`; a refused run writes
 *           nothing. Dotfiles (`.DS_Store`) are skipped, and the site's dot folders (Mintlify's caches, React Router's
 *           types) and the Fumadocs `build/` output are never removed.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decision 5); ADR 0294 (decision 22); STA-1316;
 *                     ADR 0514 (and its amendment of 2026-11-09: the docs member); STA-2026.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
import { DOCS_SITE_DIR } from "#core/constants/docs-site-dir.constant";
import { emitDocsSite } from "#core/functions/emit-docs-site.function";
import type { DocsSiteInput } from "#core/types/docs-site-input.type";
import type { GenError } from "#core/types/gen-error.type";
import { filesUnder } from "#node/functions/files-under.function";
import { isDocsMember } from "#node/functions/is-docs-member.function";
import { readDocsMember } from "#node/functions/read-docs-member.function";
import { readServiceManifests } from "#node/functions/read-service-manifests.function";
import type { DocsMember } from "#node/types/docs-member.type";
import type { GenerateResult } from "#node/types/generate-result.type";

/** One refusal about the config file itself. */
const configError = (message: string, fix: string): GenError => ({
  code: "docs_config_invalid",
  file: DOCS_CONFIG_FILE,
  line: 0,
  column: 0,
  subject: DOCS_CONFIG_FILE,
  message,
  fix,
});

/**
 * The fields of the `DocsConfig` subclass `docs.config.ts` exports, or the refusal. Imported with a fresh query each
 * time so a watch run sees an edit.
 */
async function readDocsConfig(root: string): Promise<DocsSiteInput["config"] | GenError> {
  // shortcut: the config is imported (Node 24 strips its types), not read from the syntax tree; it is a data-only
  // class, so nothing else runs. Upgrade to the host's constant evaluator if `--check` must run without importing.
  const url = `${pathToFileURL(join(root, DOCS_CONFIG_FILE)).href}?t=${Date.now()}`;
  const module = (await import(url)) as Record<string, unknown>;
  const classes = Object.values(module).filter(
    (value): value is new () => DocsSiteInput["config"] => typeof value === "function",
  );
  const [Config] = classes;
  if (classes.length !== 1 || Config === undefined)
    return configError(
      `${DOCS_CONFIG_FILE} exports ${classes.length} classes; gen reads exactly one`,
      "export one class that extends DocsConfig from @stackra/gen",
    );
  const config = new Config();
  if (typeof config.name !== "string" || !Array.isArray(config.navigation))
    return configError(
      `the class ${DOCS_CONFIG_FILE} exports has no \`name\` or \`navigation\``,
      "extend DocsConfig from @stackra/gen and set `name`, `colors` and `navigation`",
    );
  return {
    ...config,
    apiReference: config.apiReference ?? [],
    redirects: config.redirects ?? [],
    raw: config.raw ?? {},
  };
}

/** The docs app at `root` as a docs-site source, or the refusal of its config. */
async function readDocsApp(
  root: string,
): Promise<(Omit<DocsMember, "source"> & { readonly fumadocs: boolean }) | GenError> {
  const config = await readDocsConfig(root);
  if ("code" in config) return config;
  const src = join(root, "src");
  const files = filesUnder(src).map((path) =>
    /\.mdx?$/.test(path) ? { path, content: readFileSync(join(src, path), "utf8") } : { path },
  );
  // A docs app that depends on `fumadocs-ui` is built as a Fumadocs site (ADR 0514, STA-2026); any other keeps Mintlify.
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    readonly dependencies?: Readonly<Record<string, string>>;
    readonly devDependencies?: Readonly<Record<string, string>>;
  };
  const fumadocs = "fumadocs-ui" in { ...manifest.dependencies, ...manifest.devDependencies };
  return { config, files, resolve: (from) => join(src, from), fumadocs };
}

/**
 * Assembles the site of the docs app or docs member at `root`.
 *
 * @param root - the member root.
 * @param options - `check` reports the refusals and writes nothing.
 * @throws Error when the config cannot be imported or a service manifest is not valid JSON.
 * @example
 * const { errors, changed } = await generateDocsSite("/repo/apps/docs");
 */
export async function generateDocsSite(
  root: string,
  options: { readonly check?: boolean } = {},
): Promise<GenerateResult> {
  // A docs member (ADR 0514 amendment of 2026-11-09) is always a Fumadocs site; a docs app chooses by its dependencies.
  const read = isDocsMember(root)
    ? readDocsMember(root)
    : await readDocsApp(root).then((app) => ("code" in app ? { errors: [app] } : app));
  if ("errors" in read) return { errors: read.errors, files: [], changed: [] };
  const { config, files, resolve } = read;
  const services = readServiceManifests(root, config.apiReference);
  const site = emitDocsSite(
    { config, files, services, ...("source" in read ? { source: read.source } : {}) },
    "fumadocs" in read && !read.fumadocs ? "mintlify" : "fumadocs",
  );
  if (site.errors.length > 0) return { errors: site.errors, files: [], changed: [] };
  const generated = site.files.map((file) => ({
    path: `${DOCS_SITE_DIR}/${file.path}`,
    content: file.content,
  }));
  // A warning (a page not yet translated) prints beside the outcome and never blocks writing.
  const warnings = site.warnings === undefined ? {} : { warnings: site.warnings };
  if (options.check === true) return { errors: [], files: generated, changed: [], ...warnings };

  const out = join(root, DOCS_SITE_DIR);
  const changed: string[] = [];
  for (const file of site.files) {
    const path = join(out, file.path);
    if (existsSync(path) && readFileSync(path, "utf8") === file.content) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
    changed.push(`${DOCS_SITE_DIR}/${file.path}`);
  }
  for (const copy of site.copies) {
    const from = resolve(copy.from);
    const to = join(out, copy.to);
    if (existsSync(to) && readFileSync(to).equals(readFileSync(from))) continue;
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    changed.push(`${DOCS_SITE_DIR}/${copy.to}`);
  }
  const kept = new Set([
    ...site.files.map((file) => file.path),
    ...site.copies.map((copy) => copy.to),
  ]);
  // The Fumadocs `build/` output is React Router's, never gen's to prune.
  for (const stale of filesUnder(out).filter(
    (path) => !kept.has(path) && !path.startsWith("build/"),
  )) {
    rmSync(join(out, stale));
    changed.push(`${DOCS_SITE_DIR}/${stale}`);
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return { errors: [], files: generated, changed: changed.sort(), ...warnings };
}
