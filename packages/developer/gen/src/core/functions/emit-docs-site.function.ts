/**
 * Stackra file contract:
 * Purpose: `emitDocsSite`, the docs-site target: from a docs app's `DocsConfig` and its `src/` tree, the site gen
 *          writes to `.stackra/site/`. The `mintlify` renderer (the default until the docs app switches, STA-2026)
 *          writes the Mintlify root: `docs.json` (navigation checked against `src/docs`, `{ folder }` entries
 *          expanded), the pages of `src/docs` at the site root so `src/docs/guides/x.mdx` serves `/guides/x`, the
 *          snippets, the assets to copy, `api-reference/<service>/openapi.json` from each consumed service's committed
 *          manifest (an API reference tab after the authored tabs) and `llms.txt`. The `fumadocs` renderer writes a
 *          Fumadocs site on Vite and React Router, prerendered to static files: the pages under `content/` (a
 *          Mintlify snippet import becomes an `<include>`), `app/site.json` (the navigation as a Fumadocs page tree,
 *          the page paths, the logo, links, footer and `raw` layout options), `app/theme.css` from the colours, the
 *          site shell from `#core/templates/docs-site`, and under `public/` the assets, `llms.txt`, `llms-full.txt`,
 *          `_redirects` and each service's OpenAPI document with a generated page listing its operations.
 *          Both refuse a `docs.json` or `README.md` under `src/` and any stray file there (`docs_source_misplaced`),
 *          a page outside `src/docs` (`docs_page_outside`), a navigation entry with no page (`docs_page_missing`), a
 *          page no entry lists (`docs_page_unlisted`), a logo or favicon with no asset (`docs_asset_missing`), a media
 *          asset no page, snippet or config field references (`docs_asset_unreferenced`), an owned key in `raw`
 *          (`docs_owned_key`) and an API reference service with no manifest (`docs_service_unknown`). The `fumadocs`
 *          renderer also refuses a redirect from a page's own path (`docs_redirect_shadows_page`), a redirect to
 *          neither a page nor an absolute URL (`docs_redirect_target_missing`), and a capitalised tag outside code
 *          that is neither in the component map nor imported by its page (`docs_component_unknown`). With
 *          `locales` (Fumadocs only), a `<page>.<code>.mdx` beside its default page is that page in the locale, served
 *          under `/<code>/` with the locale's page tree, direction, interface strings and font and the multi-language
 *          shell; a translation without its default page (`docs_locale_page_orphan`), a default page in a locale's
 *          folder (`docs_locale_path_taken`) and malformed locales (`docs_locales_invalid`,
 *          `docs_locales_unsupported` on Mintlify) are refused; a default page with no translation is a warning
 *          (`docs_locale_page_untranslated`). An empty `locales` writes the site byte for byte as before.
 *          The paths above are a docs app's; every message, `file` field and generated-file header names the paths of
 *          `input.source` instead (a docs member: `content/`, `content/assets`, `content/snippets`, `docs.yaml` for
 *          the settings and `content/**\/meta.json` for the navigation; ADR 0514 amendment of 2026-11-09), and a docs
 *          app's (`DOCS_APP_SOURCE`) when it is absent, so a docs app's output is byte for byte as before.
 * Boundary: pure and deterministic: files sorted by path, `docs.json` and `site.json` keys in a fixed order with
 *           `raw` in authored order. When there is a refusal nothing is returned to write. Nothing it returns lands in
 *           the source.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment: the clean source layout and the generated site); ADR 0295
 *                     (decisions 3 and 5); ADR 0039 (the API reference on Mintlify); ADR 0158 (from the manifest,
 *                     never a hand-kept openapi.json); ADR 0514 (decisions 1, 9 and 10: Fumadocs, prerendered, the
 *                     transitional Mintlify component map; amendment of 2026-11-09: the docs member); STA-1316;
 *                     STA-2026.
 */
import { kebabCase } from "@stackra/support";

import { DOCS_APP_SOURCE } from "#core/constants/docs-app-source.constant";
import { DOCS_LOCALE_UI } from "#core/constants/docs-locale-ui.constant";
import { DOCS_OWNED_KEYS } from "#core/constants/docs-owned-keys.constant";
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { byIndexThenPath } from "#core/functions/by-index-then-path.function";
import { openApiOf } from "#core/functions/open-api-of.function";
import { APP_CSS_TEMPLATE } from "#core/templates/docs-site/app-css.template";
import { ENTRY_SERVER_TEMPLATE } from "#core/templates/docs-site/entry-server.template";
import { FOOTER_TEMPLATE } from "#core/templates/docs-site/footer.template";
import { I18N_LAYOUT_TEMPLATE } from "#core/templates/docs-site/i18n-layout.template";
import { I18N_PAGE_ROUTE_TEMPLATE } from "#core/templates/docs-site/i18n-page-route.template";
import { I18N_ROOT_TEMPLATE } from "#core/templates/docs-site/i18n-root.template";
import { LAYOUT_TEMPLATE } from "#core/templates/docs-site/layout.template";
import { LOCALE_LIB_TEMPLATE } from "#core/templates/docs-site/locale-lib.template";
import { MDX_COMPONENTS_TEMPLATE } from "#core/templates/docs-site/mdx-components.template";
import { NOT_FOUND_ROUTE_TEMPLATE } from "#core/templates/docs-site/not-found-route.template";
import { PAGE_ROUTE_TEMPLATE } from "#core/templates/docs-site/page-route.template";
import { REACT_ROUTER_CONFIG_TEMPLATE } from "#core/templates/docs-site/react-router-config.template";
import { ROOT_TEMPLATE } from "#core/templates/docs-site/root.template";
import { ROUTES_TEMPLATE } from "#core/templates/docs-site/routes.template";
import { SEARCH_DIALOG_TEMPLATE } from "#core/templates/docs-site/search-dialog.template";
import { SEARCH_ROUTE_TEMPLATE } from "#core/templates/docs-site/search-route.template";
import { SOURCE_TEMPLATE } from "#core/templates/docs-site/source.template";
import { TSCONFIG_TEMPLATE } from "#core/templates/docs-site/tsconfig.template";
import { VITE_CONFIG_TEMPLATE } from "#core/templates/docs-site/vite-config.template";
import type { DocsGroup } from "#core/types/docs-group.type";
import type { DocsLocale } from "#core/types/docs-locale.type";
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

/** The layout keys gen writes for the Fumadocs renderer; `raw` may not set them. */
const FUMADOCS_OWNED_KEYS: ReadonlySet<string> = new Set(["nav", "links", "tree", "children"]);

/**
 * The capitalised tags a Fumadocs page may use without importing them: Fumadocs' MDX components and the Mintlify
 * names of `app/mdx-components.tsx` (`MDX_COMPONENTS_TEMPLATE`).
 */
const MDX_COMPONENTS: ReadonlySet<string> = new Set([
  "Accordion",
  "AccordionGroup",
  "Callout",
  "CalloutContainer",
  "CalloutDescription",
  "CalloutTitle",
  "Card",
  "CardGroup",
  "Cards",
  "Check",
  "CodeBlockTab",
  "CodeBlockTabs",
  "CodeBlockTabsList",
  "CodeBlockTabsTrigger",
  "CodeGroup",
  "Frame",
  "Info",
  "Note",
  "Step",
  "Steps",
  "Tab",
  "Tabs",
  "Tip",
  "Warning",
]);

/** The site shell of the Fumadocs renderer, by path under `.stackra/site/`. */
const FUMADOCS_SHELL: readonly (readonly [string, string])[] = [
  ["app/app.css", APP_CSS_TEMPLATE],
  ["app/components/footer.tsx", FOOTER_TEMPLATE],
  ["app/components/search.tsx", SEARCH_DIALOG_TEMPLATE],
  ["app/entry.server.tsx", ENTRY_SERVER_TEMPLATE],
  ["app/lib/layout.tsx", LAYOUT_TEMPLATE],
  ["app/lib/source.ts", SOURCE_TEMPLATE],
  ["app/mdx-components.tsx", MDX_COMPONENTS_TEMPLATE],
  ["app/root.tsx", ROOT_TEMPLATE],
  ["app/routes.ts", ROUTES_TEMPLATE],
  ["app/routes/not-found.tsx", NOT_FOUND_ROUTE_TEMPLATE],
  ["app/routes/page.tsx", PAGE_ROUTE_TEMPLATE],
  ["app/routes/search.ts", SEARCH_ROUTE_TEMPLATE],
  ["react-router.config.ts", REACT_ROUTER_CONFIG_TEMPLATE],
  ["tsconfig.json", TSCONFIG_TEMPLATE],
  ["vite.config.ts", VITE_CONFIG_TEMPLATE],
];

/** The shell files a multi-language site replaces, by path, and the one it adds. */
const I18N_SHELL: ReadonlyMap<string, string> = new Map([
  ["app/lib/layout.tsx", I18N_LAYOUT_TEMPLATE],
  ["app/lib/locale.ts", LOCALE_LIB_TEMPLATE],
  ["app/root.tsx", I18N_ROOT_TEMPLATE],
  ["app/routes/page.tsx", I18N_PAGE_ROUTE_TEMPLATE],
]);

/** A language code: lower case, two or three letters, with an optional upper-case region. */
const LOCALE_CODE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

/** The interface strings, labels and font of `locale`'s base language; undefined for one gen has none for. */
const uiOf = (locale: DocsLocale) => DOCS_LOCALE_UI[locale.code.split("-")[0] ?? ""];

/** One page read from `src/docs`. */
type Page = { readonly path: string; readonly content: string };

/** One navigation group with its `{ folder }` entries expanded: page ids and nested groups. */
type Group = {
  readonly group: string;
  readonly icon?: string;
  readonly pages: readonly (string | Group)[];
};

/** One API reference: its service key, its OpenAPI document's path and text. */
type Service = { readonly key: string; readonly path: string; readonly content: string };

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

/** A comparator by the string `key` gives. */
const byPath =
  <T>(key: (item: T) => string) =>
  (a: T, b: T): number =>
    key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;

/** `text` with every character but line breaks turned into a space, so offsets and lines still match. */
const blank = (text: string): string => text.replaceAll(/[^\n]/g, " ");

/**
 * A page with its frontmatter, comments, fenced and indented code blocks and inline code blanked out, so a scan for
 * tags and imports reads only the MDX a reader sees rendered.
 */
function proseOf(content: string): string {
  return content
    .replace(FRONTMATTER, blank)
    .replaceAll(
      /^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\n[ \t]*\2[ \t]*(?=\n|$)|(?![\s\S]))/gm,
      blank,
    )
    .replaceAll(/\{\/\*[\s\S]*?\*\/\}|<!--[\s\S]*?-->/g, blank)
    .replaceAll(/(`+)(?:(?!\n[ \t]*\n)[\s\S])*?\1/g, blank);
}

/** The local names an `import` clause binds (`X`, `{ A, B as C, type D }`, `* as N`). */
function importedNames(clause: string): string[] {
  const names: string[] = [];
  const braces = /\{([^}]*)\}/.exec(clause)?.[1];
  for (const part of (braces ?? "").split(","))
    names.push(
      part
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .at(-1) ?? "",
    );
  const outside = clause.replace(/\{[^}]*\}/, "").replace(/\*\s+as\s+/, "");
  for (const part of outside.split(",")) names.push(part.trim());
  return names.filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
}

/** The navigation of `tabs` as a Fumadocs page tree: tabs are root folders, groups separators, nested groups folders. */
function pageTreeOf(
  name: string,
  tabs: readonly { readonly tab: string; readonly groups: readonly Group[] }[],
  title: (id: string) => string,
  url: (id: string) => string = urlOf,
  label: (text: string) => string = (text) => text,
): unknown {
  const nodes = (group: Group, id: string): unknown[] =>
    group.pages.map((entry, index) =>
      typeof entry === "string"
        ? { type: "page", name: title(entry), url: url(entry) }
        : {
            $id: `${id}.${index}`,
            type: "folder",
            name: label(entry.group),
            defaultOpen: true,
            children: nodes(entry, `${id}.${index}`),
          },
    );
  return {
    name,
    children: tabs.map((tab, t) => ({
      $id: `tab.${t}`,
      type: "folder",
      name: label(tab.tab),
      root: true,
      children: tab.groups.flatMap((group, g) => [
        { $id: `tab.${t}.${g}`, type: "separator", name: label(group.group) },
        ...nodes(group, `tab.${t}.${g}`),
      ]),
    })),
  };
}

/** `text` as code in a Markdown table cell. */
const cell = (text: string): string => `\`${text.replaceAll("|", "\\|")}\``;

/** A generated page listing the operations of one service's OpenAPI document. */
function apiReferencePage(service: Service): string {
  const document = JSON.parse(service.content) as {
    readonly paths: Readonly<
      Record<string, Readonly<Record<string, { readonly summary?: string }>>>
    >;
  };
  const rows = Object.entries(document.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(
      ([method, operation]) =>
        `| ${cell(method.toUpperCase())} | ${cell(path)} | ${(operation.summary ?? "").replaceAll("|", "\\|")} |`,
    ),
  );
  return [
    "---",
    `title: "${service.key} API"`,
    `description: "The HTTP operations of the ${service.key} service, from its committed manifest."`,
    "---",
    "",
    `The OpenAPI document: [${service.path}](/${service.path}).`,
    "",
    ...(rows.length === 0
      ? ["The service exposes no HTTP operation."]
      : ["| Method | Path | Operation |", "| --- | --- | --- |", ...rows]),
    "",
  ].join("\n");
}

/** `text` under the generated-file notice naming `from`, in the comment syntax of `path`'s kind. */
function noticed(path: string, text: string, from: string): string {
  if (path.endsWith(".css")) return `/* ${GENERATED_NOTICE}; from ${from} */\n${text}`;
  if (/\.(?:tsx?|json)$/.test(path)) return `// ${GENERATED_NOTICE}; from ${from}\n${text}`;
  return text;
}

/**
 * The site of a docs app or a docs member.
 *
 * @param input - the settings and navigation, the source files, the found service manifests and where the source lives.
 * @param renderer - the site to write: the Mintlify root (default) or the Fumadocs site.
 * @example
 * const { errors, files, copies } = emitDocsSite({ config, files: [{ path: "docs/index.mdx", content }], services: [] });
 * files.map((file) => file.path); // ["docs.json", "index.mdx", "llms.txt"]
 */
export function emitDocsSite(
  input: DocsSiteInput,
  renderer: "mintlify" | "fumadocs" = "mintlify",
): DocsSite {
  const { config } = input;
  const source = input.source ?? DOCS_APP_SOURCE;
  // A source file's own path, from its path in the docs app layout (`docs/x.mdx` is `src/docs/x.mdx` in a docs app).
  const whereOf = (path: string): string =>
    path.startsWith("docs/")
      ? `${source.pages}/${path.slice("docs/".length)}`
      : path.startsWith("assets/")
        ? `${source.assets}/${path.slice("assets/".length)}`
        : path.startsWith("snippets/")
          ? `${source.snippets}/${path.slice("snippets/".length)}`
          : `${source.root}/${path}`;
  const fumadocs = renderer === "fumadocs";
  const errors: GenError[] = [];
  const refuse = (code: string, file: string, subject: string, message: string, fix: string) =>
    errors.push({ code, file, line: 0, column: 0, subject, message, fix });
  const warnings: GenError[] = [];

  // Locales: one default, codes well formed and unique; only the Fumadocs renderer serves more than one language.
  const locales = config.locales ?? [];
  if (locales.length > 0) {
    const codes = locales.map((locale) => locale.code);
    const defaults = locales.filter((locale) => locale.default === true);
    if (!fumadocs)
      refuse(
        "docs_locales_unsupported",
        source.config,
        "locales",
        "`locales` is set, but only a Fumadocs site serves more than one language",
        "add fumadocs-ui to the docs app's dependencies, or remove `locales`",
      );
    for (const code of codes.filter(
      (each, index) => !LOCALE_CODE.test(each) || codes.indexOf(each) !== index,
    ))
      refuse(
        "docs_locales_invalid",
        source.config,
        `locales.${code}`,
        `the locale code ${code} is malformed or listed twice`,
        "write each code once, lower case with an optional upper-case region (`ar`, `ar-SA`)",
      );
    if (defaults.length !== 1)
      refuse(
        "docs_locales_invalid",
        source.config,
        "locales",
        `${defaults.length} locales are marked default; a site has exactly one`,
        "set `default: true` on the one locale whose pages are the source pages",
      );
  }
  const others = new Set(
    locales.filter((locale) => locale.default !== true).map((locale) => locale.code),
  );
  // A translated page: `<page>.<code>.mdx`, served as the page `<code>/<page>`.
  const translations = new Map<string, Page & { readonly base: string; readonly source: string }>();

  // Placement: src/ holds docs/, assets/, snippets/ and config/ only.
  const pages = new Map<string, Page>();
  const snippets: { readonly path: string; readonly content?: string }[] = [];
  const assets: string[] = [];
  for (const file of input.files) {
    const where = whereOf(file.path);
    const name = file.path.slice(file.path.lastIndexOf("/") + 1);
    if (name === "docs.json" || name === "README.md")
      refuse(
        "docs_source_misplaced",
        where,
        name,
        name === "docs.json"
          ? `a docs.json sits under ${source.root}/: gen writes docs.json from the DocsConfig`
          : `a README.md sits under ${source.root}/, where it would be published as a page`,
        name === "docs.json"
          ? `move its settings into ${source.config} and delete it`
          : "move it to the member root, beside package.json",
      );
    else if (file.path.startsWith("docs/")) {
      const relative = file.path.slice("docs/".length);
      const id = relative.replace(PAGE, "");
      const dot = id.lastIndexOf(".");
      const code = dot > 0 ? id.slice(dot + 1) : "";
      if (PAGE.test(file.path) && others.has(code)) {
        const base = id.slice(0, dot);
        translations.set(`${code}/${base}`, {
          path: `${code}/${base}${relative.endsWith(".md") ? ".md" : ".mdx"}`,
          content: file.content ?? "",
          base,
          source: where,
        });
      } else if (PAGE.test(file.path))
        pages.set(id, { path: relative, content: file.content ?? "" });
      else
        refuse(
          "docs_source_misplaced",
          where,
          name,
          `${where} is not a page: ${source.pages} holds .mdx and .md pages only`,
          `move it to ${source.assets}/ and reference it as /assets/${name}`,
        );
    } else if (file.path.startsWith("snippets/")) snippets.push(file);
    else if (PAGE.test(file.path))
      refuse(
        "docs_page_outside",
        where,
        name,
        `${where} is a page outside ${source.pages}`,
        `move it under ${source.pages}/ (a reusable fragment goes in ${source.snippets}/)`,
      );
    else if (file.path.startsWith("assets/")) assets.push(file.path.slice("assets/".length));
    else if (!(file.path.startsWith("config/") && file.path.endsWith(".ts")))
      refuse(
        "docs_source_misplaced",
        where,
        name,
        `${where} is outside the docs layout: ${source.root}/ holds docs/, assets/, snippets/ and config/ only`,
        `move it into one of those folders, or out of ${source.root}/ when it is not part of the site`,
      );
  }

  for (const key of Object.keys(config.raw))
    if ((fumadocs ? FUMADOCS_OWNED_KEYS : DOCS_OWNED_KEYS).has(key))
      refuse(
        "docs_owned_key",
        source.config,
        `raw.${key}`,
        `\`raw\` sets \`${key}\`, which gen writes from the typed fields`,
        fumadocs
          ? `remove \`${key}\` from \`raw\`: gen writes it from the logo, navbar and navigation fields`
          : `set it through the \`${key === "$schema" ? "theme" : key}\` field of the DocsConfig instead`,
      );

  // Navigation: every entry names a page, every page is named once or more.
  const listed = new Set<string>();
  const order: string[] = [];
  const list = (id: string): void => {
    if (!listed.has(id)) order.push(id);
    listed.add(id);
  };
  const expand = (entry: DocsGroup["pages"][number]): (string | Group)[] => {
    if (typeof entry === "string") {
      if (!pages.has(entry))
        refuse(
          "docs_page_missing",
          source.navigation,
          entry,
          `the navigation lists ${entry}, which has no ${source.pages}/${entry}.mdx`,
          `create ${source.pages}/${entry}.mdx, or remove the entry`,
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
          source.navigation,
          `folder:${entry.folder}`,
          `the navigation lists the folder ${entry.folder}, which holds no page under ${source.pages}`,
          `add a page to ${source.pages}/${entry.folder}/, or remove the entry`,
        );
      ids.forEach(list);
      return ids;
    }
    return [group(entry)];
  };
  const group = (entry: DocsGroup): Group => ({
    group: entry.group,
    ...(entry.icon === undefined ? {} : { icon: entry.icon }),
    pages: entry.pages.flatMap(expand),
  });
  const tabs = config.navigation.map((tab) => ({
    tab: tab.tab,
    ...(tab.icon === undefined ? {} : { icon: tab.icon }),
    groups: tab.groups.map(group),
  }));
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const [id, page] of [...pages].sort(([a], [b]) => (a < b ? -1 : 1)))
    if (!listed.has(id))
      refuse(
        "docs_page_unlisted",
        `${source.pages}/${page.path}`,
        id,
        `${source.pages}/${page.path} is in no navigation group, so no reader can reach it`,
        `list "${id}" (or its folder) in a group of ${source.navigation}, or delete the page`,
      );

  // Translations: each has its default page; a default page in a locale's folder would collide with the locale's paths.
  for (const [id, translation] of translations)
    if (!pages.has(translation.base))
      refuse(
        "docs_locale_page_orphan",
        translation.source,
        id,
        `${translation.source} translates ${source.pages}/${translation.base}.mdx, which does not exist`,
        `add ${source.pages}/${translation.base}.mdx in the default locale, or delete the translation`,
      );
  for (const id of pages.keys())
    if (others.has(id.split("/")[0] ?? ""))
      refuse(
        "docs_locale_path_taken",
        `${source.pages}/${pages.get(id)?.path ?? id}`,
        id,
        `${source.pages}/${pages.get(id)?.path ?? id} sits in the folder of the locale ${id.split("/")[0]}, whose pages are served there`,
        "move the page to another folder, or write it as a translation (`<page>.<code>.mdx`) beside its default page",
      );
  for (const code of others)
    for (const id of order)
      if (!translations.has(`${code}/${id}`))
        warnings.push({
          code: "docs_locale_page_untranslated",
          file: `${source.pages}/${pages.get(id)?.path ?? id}`,
          line: 0,
          column: 0,
          subject: `${code}/${id}`,
          message: `${source.pages}/${pages.get(id)?.path ?? id} has no ${code} translation, so the ${code} site links to it`,
          fix: `add ${source.pages}/${id}.${code}.mdx when the translation is ready`,
          severity: "warning",
        });

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
        source.config,
        field,
        `${field} names ${path}, which is not in ${source.assets}`,
        `add ${source.assets}/${path}, or name an asset that exists`,
      );
  const corpus = [
    ...[...pages.values(), ...translations.values()].map((page) => page.content),
    ...snippets.map((snippet) => snippet.content ?? ""),
    ...[config.logo?.light, config.logo?.dark, config.favicon].map((path) => `assets/${path}`),
    JSON.stringify([config.navbar, config.footer, config.raw]),
  ].join("\n");
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const asset of [...assets].sort())
    if (MEDIA.test(asset) && !corpus.includes(`assets/${asset}`))
      refuse(
        "docs_asset_unreferenced",
        `${source.assets}/${asset}`,
        asset,
        `${source.assets}/${asset} is referenced by no page, snippet or config field`,
        `reference it as /assets/${asset}, or delete it`,
      );

  // API reference: one OpenAPI document per consumed service, from its committed manifest.
  const services: Service[] = [];
  for (const key of config.apiReference) {
    const found = input.services.find((service) => kebabCase(service.member) === kebabCase(key));
    if (found === undefined)
      refuse(
        "docs_service_unknown",
        source.config,
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

  const llms = [`# ${config.name}`, ""];
  if (config.description !== undefined) llms.push(`> ${config.description}`, "");
  for (const id of order) {
    const content = pages.get(id)?.content ?? "";
    const description = frontmatter(content, "description");
    llms.push(
      `- [${frontmatter(content, "title") ?? id}](${urlOf(id)})${description === undefined ? "" : `: ${description}`}`,
    );
  }

  if (!fumadocs) {
    if (errors.length > 0) return { errors, files: [], copies: [] };
    return mintlifySite(input, tabs, pages, snippets, assets, services, llms);
  }

  // Fumadocs: redirects, and the components and snippet imports of each page.
  const urls = new Set(order.map(urlOf));
  for (const redirect of config.redirects) {
    if (urls.has(redirect.from))
      refuse(
        "docs_redirect_shadows_page",
        source.config,
        `redirects.${redirect.from}`,
        `a redirect leaves ${redirect.from}, which is a page, so the page could never be reached`,
        `remove the redirect, or move the page and redirect its old path`,
      );
    if (!/^https?:\/\//.test(redirect.to) && !urls.has(redirect.to.replace(/[?#].*$/, "")))
      refuse(
        "docs_redirect_target_missing",
        source.config,
        `redirects.${redirect.from}`,
        `the redirect from ${redirect.from} goes to ${redirect.to}, which is neither a page nor an absolute URL`,
        `point it at a page path (such as /quickstart) or an https:// URL`,
      );
  }
  // A translation is checked and written as a page of its own, under its locale's folder.
  for (const [id, translation] of translations)
    pages.set(id, { path: translation.path, content: translation.content });
  const content = new Map<string, string>();
  // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
  for (const [id, page] of [...pages].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const where = `${source.pages}/${page.path}`;
    const prose = proseOf(page.content);
    const names = new Set(MDX_COMPONENTS);
    const includes = new Map<string, string>();
    // Edits by offset into `prose`, which keeps the offsets of `page.content`, so code that shows an import is kept.
    const edits: { readonly start: number; readonly end: number; readonly text: string }[] = [];
    const up = "../".repeat(page.path.split("/").length);
    for (const match of prose.matchAll(
      /^import\s+([\s\S]+?)\s+from\s+["']([^"']+)["'];?[ \t]*$/gm,
    )) {
      const [line, clause = "", from = ""] = match;
      if (from.startsWith("/snippets/") && /^[A-Za-z_$][\w$]*$/.test(clause.trim())) {
        includes.set(clause.trim(), `${up}snippets/${from.slice("/snippets/".length)}`);
        const end = match.index + line.length;
        edits.push({ start: match.index, end: prose[end] === "\n" ? end + 1 : end, text: "" });
      } else for (const name of importedNames(clause)) names.add(name);
    }
    for (const [name, path] of includes) {
      if (new RegExp(`<${name}\\s+[^/>\\s]`).test(prose))
        refuse(
          "docs_component_unknown",
          where,
          name,
          `${where} passes props to the snippet <${name}>, and a Fumadocs include takes none`,
          `inline the snippet's text in the page, or drop the props`,
        );
      for (const match of prose.matchAll(new RegExp(`<${name}\\s*/>`, "g")))
        edits.push({
          start: match.index,
          end: match.index + match[0].length,
          text: `<include>${path}</include>`,
        });
    }
    let text = page.content;
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    for (const edit of edits.sort((a, b) => b.start - a.start))
      text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
    const unknown = new Set<string>();
    for (const match of prose.matchAll(/<([A-Z][\w$]*)(?:\.[\w$]+)*(?=[\s/>])/g)) {
      const name = match[1] ?? "";
      if (!names.has(name) && !includes.has(name)) unknown.add(name);
    }
    for (const name of unknown)
      refuse(
        "docs_component_unknown",
        where,
        name,
        `${where} uses <${name}>, which is neither a component of the site's MDX map nor imported by the page`,
        `import ${name} in the page, use a mapped component, or write it as code: \`<${name}>\``,
      );
    content.set(id, text);
  }

  if (errors.length > 0) return { errors, files: [], copies: [] };
  const site = fumadocsSite(input, tabs, pages, content, snippets, assets, services, llms, order, [
    ...translations.keys(),
  ]);
  return warnings.length === 0 ? site : { ...site, warnings };
}

/** The Mintlify root of a docs app with no refusal. */
function mintlifySite(
  input: DocsSiteInput,
  authored: readonly unknown[],
  pages: ReadonlyMap<string, Page>,
  snippets: readonly { readonly path: string; readonly content?: string }[],
  assets: readonly string[],
  services: readonly Service[],
  llms: readonly string[],
): DocsSite {
  const { config } = input;
  const tabs: unknown[] = [...authored];
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

/** The Fumadocs site of a docs app with no refusal. */
function fumadocsSite(
  input: DocsSiteInput,
  authored: readonly { readonly tab: string; readonly groups: readonly Group[] }[],
  pages: ReadonlyMap<string, Page>,
  content: ReadonlyMap<string, string>,
  snippets: readonly { readonly path: string; readonly content?: string }[],
  assets: readonly string[],
  services: readonly Service[],
  llms: readonly string[],
  order: readonly string[],
  translated: readonly string[] = [],
): DocsSite {
  const { config } = input;
  const from = (input.source ?? DOCS_APP_SOURCE).config;
  const locales: readonly DocsLocale[] = config.locales ?? [];
  const reference = services.map((service) => ({
    id: `api-reference/${kebabCase(service.key)}`,
    service,
  }));
  const tabs = [
    ...authored,
    ...(reference.length === 0
      ? []
      : [
          {
            tab: "API reference",
            groups: [{ group: "Services", pages: reference.map((entry) => entry.id) }],
          },
        ]),
  ];
  const generated = new Map(reference.map((entry) => [entry.id, apiReferencePage(entry.service)]));
  const title = (id: string): string => {
    const text = pages.get(id)?.content ?? generated.get(id) ?? "";
    return frontmatter(text, "sidebarTitle") ?? frontmatter(text, "title") ?? id;
  };
  const paths = [...order, ...generated.keys(), ...translated].map(urlOf);
  const has = new Set(translated);
  const tree = pageTreeOf(config.name, tabs, title);
  // Per locale: the page in that language where it is translated, else the default page; tab and group names from the
  // locale's labels, then gen's own, then as authored.
  const localised =
    locales.length === 0
      ? {}
      : {
          locales: locales.map((locale) => ({
            code: locale.code,
            label: locale.label,
            dir: locale.dir ?? "ltr",
            prefix: locale.default === true ? "" : locale.code,
            font: uiOf(locale)?.font ?? null,
          })),
          trees: Object.fromEntries(
            locales.map((locale) => {
              if (locale.default === true) return [locale.code, tree];
              const own = (id: string) =>
                has.has(`${locale.code}/${id}`) ? `${locale.code}/${id}` : id;
              const label = (text: string) =>
                locale.labels?.[text] ?? uiOf(locale)?.labels[text] ?? text;
              return [
                locale.code,
                pageTreeOf(
                  config.name,
                  tabs,
                  (id) => title(own(id)),
                  (id) => urlOf(own(id)),
                  label,
                ),
              ];
            }),
          ),
          translations: Object.fromEntries(
            locales.map((locale) => [locale.code, uiOf(locale)?.translations ?? {}]),
          ),
        };

  const site = {
    name: config.name,
    description: config.description ?? null,
    logo:
      config.logo === undefined
        ? null
        : {
            light: `/assets/${config.logo.light}`,
            dark: `/assets/${config.logo.dark}`,
            href: config.logo.href ?? "/",
          },
    favicon: config.favicon === undefined ? null : `/assets/${config.favicon}`,
    links: [
      ...(config.navbar?.links ?? []).map((link) => ({ text: link.label, url: link.href })),
      ...(config.navbar?.primary === undefined
        ? []
        : [{ type: "button", text: config.navbar.primary.label, url: config.navbar.primary.href }]),
    ],
    footer: config.footer ?? null,
    layout: config.raw,
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    paths: [...new Set(paths)].sort(),
    tree,
    ...localised,
  };
  const theme = [
    ":root {",
    `  --color-fd-primary: ${config.colors.primary};`,
    "}",
    "",
    ".dark {",
    `  --color-fd-primary: ${config.colors.light ?? config.colors.primary};`,
    "}",
    "",
    // Each locale with its own font sets its pages in it (Arabic in IBM Plex Sans Arabic, at Arabic line height).
    ...locales.flatMap((locale) => {
      const font = uiOf(locale)?.font;
      return font === null || font === undefined
        ? []
        : [
            `html[lang="${locale.code}"] body {`,
            `  font-family: "${font.family}", ui-sans-serif, system-ui, sans-serif;`,
            "  line-height: 1.75;",
            "}",
            "",
          ];
    }),
  ].join("\n");
  const full = order.map((id) => {
    const text = pages.get(id)?.content ?? "";
    const body = text.replace(FRONTMATTER, "").trim();
    return `# ${frontmatter(text, "title") ?? id}\n\nSource: ${urlOf(id)}\n\n${body}\n`;
  });

  const files: GeneratedFile[] = [
    ...(locales.length === 0
      ? FUMADOCS_SHELL
      : [
          ...FUMADOCS_SHELL.map(([path, text]): readonly [string, string] => [
            path,
            I18N_SHELL.get(path) ?? text,
          ]),
          ["app/lib/locale.ts", LOCALE_LIB_TEMPLATE] as const,
        ]
    ).map(([path, text]) => ({ path, content: noticed(path, text, from) })),
    { path: "app/site.json", content: `${JSON.stringify(site, null, 2)}\n` },
    { path: "app/theme.css", content: noticed("app/theme.css", theme, from) },
    { path: "public/llms.txt", content: `${llms.join("\n")}\n` },
    { path: "public/llms-full.txt", content: `# ${config.name}\n\n${full.join("\n")}` },
    {
      path: "public/_redirects",
      content: config.redirects.map((redirect) => `${redirect.from} ${redirect.to} 301\n`).join(""),
    },
    ...[...pages].map(([id, page]) => ({
      path: `content/${page.path}`,
      content: content.get(id) ?? page.content,
    })),
    ...[...generated].map(([id, text]) => ({ path: `content/${id}.mdx`, content: text })),
    ...snippets.flatMap((snippet) =>
      snippet.content === undefined ? [] : [{ path: snippet.path, content: snippet.content }],
    ),
    ...services.map((service) => ({ path: `public/${service.path}`, content: service.content })),
  ];
  const copies = [
    ...assets.map((asset) => ({ from: `assets/${asset}`, to: `public/assets/${asset}` })),
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
