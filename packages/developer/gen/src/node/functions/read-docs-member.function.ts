/**
 * Stackra file contract:
 * Purpose: `readDocsMember`, a docs member (`"stackra": { "kind": "docs" }`) read from disk as the input of
 *          `emitDocsSite`, the second input of the docs site beside a docs app (ADR 0514 amendment of 2026-11-09):
 *          the settings from `docs.yaml` (`readDocsYaml`), the navigation from each folder's `content/**\/meta.json`
 *          (`navigationOfMeta`, translations `<page>.<code>` of the non-default locales left out), and every file
 *          under `content/` mapped to the emitter's layout: `assets/**` and `snippets/**` as they are, every other
 *          path under `docs/` (so `content/guides/setup.mdx` is the page `guides/setup`), with the text of each
 *          `.md` and `.mdx`. The `meta.json` files are consumed, never passed on. `resolve` maps an emitter copy's
 *          `from` back to the file under `content/`.
 * Boundary: reads `docs.yaml` and `content/` only; writes nothing. Every refusal of `docs.yaml` and the meta.json
 *           files is returned together (a meta.json that is not JSON is `docs_meta_invalid`), and then nothing else.
 * Runtime: node
 * Governing contract: ADR 0514 (amendment of 2026-11-09: the docs member).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DOCS_MEMBER_SOURCE } from "#core/constants/docs-member-source.constant";
import { navigationOfMeta } from "#core/functions/navigation-of-meta.function";
import type { GenError } from "#core/types/gen-error.type";
import { filesUnder } from "#node/functions/files-under.function";
import { readDocsYaml } from "#node/functions/read-docs-yaml.function";
import type { DocsMember } from "#node/types/docs-member.type";

/** A page file. */
const PAGE = /\.mdx?$/;

/** The folder of a path under `content/` (`` at the top). */
const parentOf = (path: string): string => path.slice(0, Math.max(0, path.lastIndexOf("/")));

/** Whether a path under `content/` is in the assets or snippets folder, outside the pages. */
const isSupport = (path: string): boolean =>
  path.startsWith("assets/") || path.startsWith("snippets/");

/** Whether a path under `content/` is a folder's navigation. */
const isMeta = (path: string): boolean =>
  !isSupport(path) && (path === "meta.json" || path.endsWith("/meta.json"));

/**
 * The docs member at `root`, or the refusals of its `docs.yaml` and meta.json files.
 *
 * @param root - the member root.
 * @example
 * const member = readDocsMember("/repo/docs");
 * if (!("errors" in member)) emitDocsSite({ ...member, services: [] }, "fumadocs");
 */
export function readDocsMember(
  root: string,
): DocsMember | { readonly errors: readonly GenError[] } {
  const content = join(root, "content");
  const yaml = readDocsYaml(root);
  const errors: GenError[] = [...yaml.errors];
  const paths = filesUnder(content);

  const metas: Record<string, unknown> = {};
  for (const path of paths.filter(isMeta)) {
    const file = `content/${path}`;
    try {
      metas[parentOf(path)] = JSON.parse(readFileSync(join(content, path), "utf8")) as unknown;
    } catch (error) {
      errors.push({
        code: "docs_meta_invalid",
        file,
        line: 0,
        column: 0,
        subject: file,
        message: `${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        fix: "write it as strict JSON (no comments, no trailing commas): Fumadocs reads it by this name",
      });
    }
  }

  // The pages as the emitter names them; a translation (`<page>.<code>`, a non-default locale) is no navigation entry.
  const others = new Set(
    (yaml.config?.locales ?? [])
      .filter((locale) => locale.default !== true)
      .map((locale) => locale.code),
  );
  const site = paths.filter((path) => !isSupport(path) && !isMeta(path));
  const pages = site
    .filter((path) => PAGE.test(path))
    .map((path) => path.replace(PAGE, ""))
    .filter((id) => {
      const dot = id.lastIndexOf(".");
      return !(dot > 0 && others.has(id.slice(dot + 1)));
    });
  const navigation = navigationOfMeta({
    name: yaml.config?.name ?? "",
    pages,
    folders: [...new Set([...site, ...paths.filter(isMeta)].map(parentOf))],
    metas,
  });
  errors.push(...navigation.errors);
  if (yaml.config === undefined || errors.length > 0) return { errors };

  return {
    // `theme` is a Mintlify setting; a docs member is always a Fumadocs site, which never reads it.
    config: { ...yaml.config, theme: "mint", navigation: navigation.navigation },
    files: paths
      .filter((path) => !isMeta(path))
      .map((path) => {
        const emitted = isSupport(path) ? path : `docs/${path}`;
        return PAGE.test(path)
          ? { path: emitted, content: readFileSync(join(content, path), "utf8") }
          : { path: emitted };
      }),
    source: DOCS_MEMBER_SOURCE,
    resolve: (from) => join(content, from.startsWith("docs/") ? from.slice("docs/".length) : from),
  };
}
