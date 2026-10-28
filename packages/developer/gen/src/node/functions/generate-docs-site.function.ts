/**
 * Stackra file contract:
 * Purpose: `generateDocsSite`, the docs-site run of `generate` for a docs app (a member with
 *          `src/config/docs.config.ts`): it imports the config, takes the one exported class and reads the fields of a
 *          new instance, lists `src/` (reading the pages and snippets), reads the committed manifests of the
 *          `apiReference` services, calls the pure `emitDocsSite`, and writes the Mintlify root into `.stackra/site/`:
 *          changed files written, assets copied, and files the run no longer produces removed. A check run reports the
 *          refusals only: the site is gitignored, so nothing in it can be stale.
 * Boundary: writes only under `<member>/.stackra/site/`, never into `src/`; a refused run writes nothing. Dotfiles
 *           (`.DS_Store`) are skipped, and the site's dot folders (Mintlify's caches) are never removed.
 * Runtime: node
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0295 (decision 5); ADR 0294 (decision 22); STA-1316.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

import { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
import { DOCS_SITE_DIR } from "#core/constants/docs-site-dir.constant";
import { emitDocsSite } from "#core/functions/emit-docs-site.function";
import type { DocsSiteInput } from "#core/types/docs-site-input.type";
import type { GenError } from "#core/types/gen-error.type";
import { readServiceManifests } from "#node/functions/read-service-manifests.function";
import type { GenerateResult } from "#node/types/generate-result.type";

/** Every file under `folder`, relative to it, sorted; dot entries skipped. */
function walk(folder: string, base = folder): string[] {
  if (!existsSync(folder)) return [];
  return (
    readdirSync(folder, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith("."))
      .flatMap((entry) =>
        entry.isDirectory()
          ? walk(join(folder, entry.name), base)
          : [relative(base, join(folder, entry.name)).split("\\").join("/")],
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
  );
}

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
  return { ...config, apiReference: config.apiReference ?? [], raw: config.raw ?? {} };
}

/**
 * Assembles the Mintlify site of the docs app at `root`.
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
  const config = await readDocsConfig(root);
  if ("code" in config) return { errors: [config], files: [], changed: [] };
  const src = join(root, "src");
  const files = walk(src).map((path) =>
    /\.mdx?$/.test(path) ? { path, content: readFileSync(join(src, path), "utf8") } : { path },
  );
  const services = readServiceManifests(root, config.apiReference);
  const site = emitDocsSite({ config, files, services });
  if (site.errors.length > 0) return { errors: site.errors, files: [], changed: [] };
  const generated = site.files.map((file) => ({
    path: `${DOCS_SITE_DIR}/${file.path}`,
    content: file.content,
  }));
  if (options.check === true) return { errors: [], files: generated, changed: [] };

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
    const from = join(src, copy.from);
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
  for (const stale of walk(out).filter((path) => !kept.has(path))) {
    rmSync(join(out, stale));
    changed.push(`${DOCS_SITE_DIR}/${stale}`);
  }
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  return { errors: [], files: generated, changed: changed.sort() };
}
