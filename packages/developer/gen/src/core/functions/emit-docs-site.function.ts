/**
 * Stackra file contract:
 * Purpose: `emitDocsSite`, the docs-site target: from a docs app's `DocsConfig` and its `src/` tree, the Mintlify root
 *          gen writes to `.stackra/site/`: `docs.json` (navigation checked against `src/docs`, `{ folder }` entries
 *          expanded), the pages of `src/docs` at the site root so `src/docs/guides/x.mdx` serves `/guides/x`, the
 *          snippets, the assets to copy, `api-reference/<service>/openapi.json` from each consumed service's committed
 *          manifest (an API reference tab after the authored tabs) and `llms.txt`. It refuses a `docs.json` or
 *          `README.md` under `src/` and any stray file there (`docs_source_misplaced`), a page outside `src/docs`
 *          (`docs_page_outside`), a navigation entry with no page (`docs_page_missing`), a page no entry lists
 *          (`docs_page_unlisted`), a logo or favicon with no asset (`docs_asset_missing`), a media asset no page,
 *          snippet or config field references (`docs_asset_unreferenced`), an owned key in `raw` (`docs_owned_key`)
 *          and an API reference service with no manifest (`docs_service_unknown`).
 * Boundary: pure and deterministic: files sorted by path, `docs.json` keys in a fixed order with `raw` in authored
 *           order. When there is a refusal nothing is returned to write. Nothing it returns lands in `src/`.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment: the clean source layout and the generated site); ADR 0295
 *                     (decisions 3 and 5); ADR 0039 (the API reference on Mintlify); ADR 0158 (from the manifest,
 *                     never a hand-kept openapi.json); STA-1316.
 */
import { kebabCase } from "@stackra/support";

import { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
import { DOCS_OWNED_KEYS } from "#core/constants/docs-owned-keys.constant";
import { openApiOf } from "#core/functions/open-api-of.function";
import type { DocsGroup } from "#core/types/docs-group.type";
import type { DocsSiteInput } from "#core/types/docs-site-input.type";
import type { DocsSite } from "#core/types/docs-site.type";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";

/** A page file. */
const PAGE = /\.mdx?$/;

/** The media an asset check covers; other files (a brand NOTICE) are copied unchecked. */
const MEDIA = /\.(?:svg|png|jpe?g|gif|webp|avif|ico|mp4|webm|pdf|woff2?|ttf|otf)$/i;

/** The frontmatter block of a page. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** The value of `key` in a page's frontmatter, quotes removed. */
function frontmatter(content: string, key: string): string | undefined {
  const block = FRONTMATTER.exec(content)?.[1] ?? "";
  const value = new RegExp(`^${key}:\\s*(.*?)\\s*$`, "m").exec(block)?.[1];
  return value?.replace(/^(["'])(.*)\1$/, "$2") || undefined;
}

/** The folder of a page id (`adr` for `adr/0001-x`, `` for `index`). */
const folderOf = (id: string): string => id.slice(0, Math.max(0, id.lastIndexOf("/")));

/** The site path of a page id: `index` pages serve their folder. */
const urlOf = (id: string): string => `/${id.replace(/(?:^|\/)index$/, "")}`;

/** `index` first, then by path. */
function byIndexThenPath(a: string, b: string): number {
  const ai = a.endsWith("index") ? 0 : 1;
  const bi = b.endsWith("index") ? 0 : 1;
  return ai - bi || (a < b ? -1 : a > b ? 1 : 0);
}

/** A comparator by the string `key` gives. */
const byPath =
  <T>(key: (item: T) => string) =>
  (a: T, b: T): number =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;

/**
 * The Mintlify site of a docs app.
 *
 * @param input - the config fields, the `src/` files and the found service manifests.
 * @example
 * const { errors, files, copies } = emitDocsSite({ config, files: [{ path: "docs/index.mdx", content }], services: [] });
 * files.map((file) => file.path); // ["docs.json", "index.mdx", "llms.txt"]
 */
export function emitDocsSite(input: DocsSiteInput): DocsSite {
  const { config } = input;
  const errors: GenError[] = [];
  const refuse = (code: string, file: string, subject: string, message: string, fix: string) =>
    errors.push({ code, file, line: 0, column: 0, subject, message, fix });

  // Placement: src/ holds docs/, assets/, snippets/ and config/ only.
  const pages = new Map<string, { readonly path: string; readonly content: string }>();
  const snippets: { readonly path: string; readonly content?: string }[] = [];
  const assets: string[] = [];
  for (const file of input.files) {
    const where = `src/${file.path}`;
    const name = file.path.slice(file.path.lastIndexOf("/") + 1);
    if (name === "docs.json" || name === "README.md")
      refuse(
        "docs_source_misplaced",
        where,
        name,
        name === "docs.json"
          ? "a docs.json sits under src/: gen writes docs.json from the DocsConfig"
          : "a README.md sits under src/, where it would be published as a page",
        name === "docs.json"
          ? `move its settings into ${DOCS_CONFIG_FILE} and delete it`
          : "move it to the member root, beside package.json",
      );
    else if (file.path.startsWith("docs/")) {
      if (PAGE.test(file.path))
        pages.set(file.path.slice("docs/".length).replace(PAGE, ""), {
          path: file.path.slice("docs/".length),
          content: file.content ?? "",
        });
      else
        refuse(
          "docs_source_misplaced",
          where,
          name,
          `${where} is not a page: src/docs holds .mdx and .md pages only`,
          `move it to src/assets/ and reference it as /assets/${name}`,
        );
    } else if (file.path.startsWith("snippets/")) snippets.push(file);
    else if (PAGE.test(file.path))
      refuse(
        "docs_page_outside",
        where,
        name,
        `${where} is a page outside src/docs`,
        `move it under src/docs/ (a reusable fragment goes in src/snippets/)`,
      );
    else if (file.path.startsWith("assets/")) assets.push(file.path.slice("assets/".length));
    else if (!(file.path.startsWith("config/") && file.path.endsWith(".ts")))
      refuse(
        "docs_source_misplaced",
        where,
        name,
        `${where} is outside the docs layout: src/ holds docs/, assets/, snippets/ and config/ only`,
        "move it into one of those folders, or out of src/ when it is not part of the site",
      );
  }

  for (const key of Object.keys(config.raw))
    if (DOCS_OWNED_KEYS.has(key))
      refuse(
        "docs_owned_key",
        DOCS_CONFIG_FILE,
        `raw.${key}`,
        `\`raw\` sets \`${key}\`, which gen writes from the typed fields`,
        `set it through the \`${key === "$schema" ? "theme" : key}\` field of the DocsConfig instead`,
      );

  // Navigation: every entry names a page, every page is named once or more.
  const listed = new Set<string>();
  const order: string[] = [];
  const list = (id: string): void => {
    if (!listed.has(id)) order.push(id);
    listed.add(id);
  };
  const expand = (entry: DocsGroup["pages"][number]): unknown[] => {
    if (typeof entry === "string") {
      if (!pages.has(entry))
        refuse(
          "docs_page_missing",
          DOCS_CONFIG_FILE,
          entry,
          `the navigation lists ${entry}, which has no src/docs/${entry}.mdx`,
          `create src/docs/${entry}.mdx, or remove the entry`,
        );
      list(entry);
      return [entry];
    }
    if ("folder" in entry) {
      const ids = [...pages.keys()]
        .filter((id) => folderOf(id) === entry.folder)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort(byIndexThenPath);
      if (ids.length === 0)
        refuse(
          "docs_page_missing",
          DOCS_CONFIG_FILE,
          `folder:${entry.folder}`,
          `the navigation lists the folder ${entry.folder}, which holds no page under src/docs`,
          `add a page to src/docs/${entry.folder}/, or remove the entry`,
        );
      ids.forEach(list);
      return ids;
    }
    return [group(entry)];
  };
  const group = (entry: DocsGroup): unknown => ({
    group: entry.group,
    ...(entry.icon === undefined ? {} : { icon: entry.icon }),
    pages: entry.pages.flatMap(expand),
  });
  const tabs: unknown[] = config.navigation.map((tab) => ({
    tab: tab.tab,
    ...(tab.icon === undefined ? {} : { icon: tab.icon }),
    groups: tab.groups.map(group),
  }));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const [id, page] of [...pages].sort(([a], [b]) => (a < b ? -1 : 1)))
    if (!listed.has(id))
      refuse(
        "docs_page_unlisted",
        `src/docs/${page.path}`,
        id,
        `src/docs/${page.path} is in no navigation group, so no reader can reach it`,
        `list "${id}" (or its folder) in a group of ${DOCS_CONFIG_FILE}, or delete the page`,
      );

  // Assets: the logo and favicon exist, and every media asset is referenced.
  const known = new Set(assets);
  for (const [field, path] of [
    ["logo.light", config.logo?.light],
    ["logo.dark", config.logo?.dark],
    ["favicon", config.favicon],
  ] as const)
    if (path !== undefined && !known.has(path))
      refuse(
        "docs_asset_missing",
        DOCS_CONFIG_FILE,
        field,
        `${field} names ${path}, which is not in src/assets`,
        `add src/assets/${path}, or name an asset that exists`,
      );
  const corpus = [
    ...[...pages.values()].map((page) => page.content),
    ...snippets.map((snippet) => snippet.content ?? ""),
    ...[config.logo?.light, config.logo?.dark, config.favicon].map((path) => `assets/${path}`),
    JSON.stringify([config.navbar, config.footer, config.raw]),
  ].join("\n");
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const asset of [...assets].sort())
    if (MEDIA.test(asset) && !corpus.includes(`assets/${asset}`))
      refuse(
        "docs_asset_unreferenced",
        `src/assets/${asset}`,
        asset,
        `src/assets/${asset} is referenced by no page, snippet or config field`,
        `reference it as /assets/${asset}, or delete it`,
      );

  // API reference: one OpenAPI document per consumed service, from its committed manifest.
  const services: { readonly key: string; readonly path: string; readonly content: string }[] = [];
  for (const key of config.apiReference) {
    const found = input.services.find((service) => kebabCase(service.member) === kebabCase(key));
    if (found === undefined)
      refuse(
        "docs_service_unknown",
        DOCS_CONFIG_FILE,
        `apiReference.${key}`,
        `apiReference names ${key}, whose committed stackra.manifest.json was not found in services/`,
        `run stackra gen in services/${kebabCase(key)} and commit its manifest, or remove the key`,
      );
    else
      services.push({
        key,
        path: `api-reference/${kebabCase(key)}/openapi.json`,
        content: `${JSON.stringify(openApiOf(found.manifest), null, 2)}\n`,
      });
  }

  if (errors.length > 0) return { errors, files: [], copies: [] };

  if (services.length > 0)
    tabs.push({
      tab: "API reference",
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: a Mintlify (Lucide) icon name in docs.json, not a Stackra icon key
      icon: "code",
      groups: services.map((service) => ({ group: service.key, openapi: service.path })),
    });
  const site = {
    $schema: "https://mintlify.com/docs.json",
    theme: config.theme,
    name: config.name,
    ...(config.description === undefined ? {} : { description: config.description }),
    colors: config.colors,
    ...(config.logo === undefined
      ? {}
      : {
          logo: {
            light: `/assets/${config.logo.light}`,
            dark: `/assets/${config.logo.dark}`,
            ...(config.logo.href === undefined ? {} : { href: config.logo.href }),
          },
        }),
    ...(config.favicon === undefined ? {} : { favicon: `/assets/${config.favicon}` }),
    ...(config.navbar === undefined
      ? {}
      : {
          navbar: {
            ...(config.navbar.links === undefined ? {} : { links: config.navbar.links }),
            ...(config.navbar.primary === undefined
              ? {}
              : { primary: { type: "button", ...config.navbar.primary } }),
          },
        }),
    ...(config.footer === undefined ? {} : { footer: config.footer }),
    ...config.raw,
    navigation: { tabs },
  };

  const llms = [`# ${config.name}`, ""];
  if (config.description !== undefined) llms.push(`> ${config.description}`, "");
  for (const id of order) {
    const content = pages.get(id)?.content ?? "";
    const description = frontmatter(content, "description");
    llms.push(
      `- [${frontmatter(content, "title") ?? id}](${urlOf(id)})${description === undefined ? "" : `: ${description}`}`,
    );
  }

  const files: GeneratedFile[] = [
    { path: "docs.json", content: `${JSON.stringify(site, null, 2)}\n` },
    { path: "llms.txt", content: `${llms.join("\n")}\n` },
    ...[...pages.values()].map((page) => ({ path: page.path, content: page.content })),
    ...snippets.flatMap((snippet) =>
      snippet.content === undefined ? [] : [{ path: snippet.path, content: snippet.content }],
    ),
    ...services.map((service) => ({ path: service.path, content: service.content })),
  ];
  const copies = [
    ...assets.map((asset) => ({ from: `assets/${asset}`, to: `assets/${asset}` })),
    ...snippets.flatMap((snippet) =>
      snippet.content === undefined ? [{ from: snippet.path, to: snippet.path }] : [],
    ),
  ];
  return {
    errors: [],
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    files: files.sort(byPath((file) => file.path)),
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    copies: copies.sort(byPath((copy) => copy.to)),
  };
}
