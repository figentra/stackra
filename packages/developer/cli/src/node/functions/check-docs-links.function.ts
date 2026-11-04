/**
 * Stackra file contract:
 * Purpose: `checkDocsLinks(client)`, the link check of a prerendered Fumadocs docs site, which replaces
 *          `mint broken-links` (STA-2026 FR-005): it reads every HTML page under the build's `client/` folder and
 *          lists each internal `href` or `src` with no file, page or `_redirects` entry behind it, and each `#anchor`
 *          with no element of that id on its target page, by page.
 * Boundary: reads only under `client`; writes nothing. External URLs (`https:`, `//host`, `mailto:` and the like) are
 *           not fetched. A page's URL is its path without `index.html` and with no trailing slash, as the Worker
 *           serves it (`html_handling: "drop-trailing-slash"`).
 * Runtime: node
 * Governing contract: ADR 0514; STA-2026 (FR-005, research R8: code in @stackra/cli, no new dependency).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** An `href` or `src` attribute. */
const LINK = /\s(?:href|src)\s*=\s*"([^"]*)"/g;

/** An `id` attribute. */
const ID = /\sid\s*=\s*"([^"]*)"/g;

/** A link to another origin or to no document. */
const EXTERNAL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

/** The five named entities an attribute value carries, decoded. */
const decode = (text: string): string =>
  text
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");

/** Every file under `folder`, relative to it, `/`-separated and sorted. */
function walk(folder: string, base = folder): string[] {
  return (
    readdirSync(folder, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory()
          ? walk(join(folder, entry.name), base)
          : [relative(base, join(folder, entry.name)).split("\\").join("/")],
      )
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort()
  );
}

/** The URL path a page file serves: `adr/x/index.html` → `/adr/x`, `index.html` → `/`, `404.html` → `/404`. */
const urlOf = (file: string): string =>
  `/${file.replace(/(?:^|\/)index\.html$/, "").replace(/\.html$/, "")}`;

/**
 * The broken internal links of the prerendered site in `client`.
 *
 * @param client - the build's `client/` folder (`.stackra/site/build/client`).
 * @returns one entry per broken link, by page then link, empty when every link resolves.
 * @example
 * checkDocsLinks("/repo/apps/docs/.stackra/site/build/client");
 * // [{ page: "/guides/x", link: "/adr/9999-missing", reason: "no page or file" }]
 */
export function checkDocsLinks(
  client: string,
): { readonly page: string; readonly link: string; readonly reason: string }[] {
  const files = walk(client);
  const pages = new Map<string, string>();
  for (const file of files.filter((path) => path.endsWith(".html")))
    pages.set(urlOf(file), readFileSync(join(client, file), "utf8"));
  const redirects = new Set(
    existsSync(join(client, "_redirects"))
      ? readFileSync(join(client, "_redirects"), "utf8")
          .split("\n")
          .map((line) => line.trim().split(/\s+/)[0] ?? "")
          .filter((from) => from.startsWith("/"))
      : [],
  );
  const ids = new Map<string, ReadonlySet<string>>();
  const idsOf = (url: string): ReadonlySet<string> => {
    let found = ids.get(url);
    if (found === undefined) {
      found = new Set(
        [...(pages.get(url) ?? "").matchAll(ID)].map((match) => decode(match[1] ?? "")),
      );
      ids.set(url, found);
    }
    return found;
  };
  const exists = (path: string): boolean => {
    const bare = path.replace(/\/$/, "") || "/";
    if (pages.has(bare) || redirects.has(bare) || redirects.has(path)) return true;
    const file = join(client, decodeURIComponent(bare));
    return existsSync(file) && statSync(file).isFile();
  };

  const broken: { readonly page: string; readonly link: string; readonly reason: string }[] = [];
  for (const [page, html] of pages) {
    const seen = new Set<string>();
    for (const match of html.matchAll(LINK)) {
      const link = decode(match[1] ?? "");
      if (link === "" || link === "#" || EXTERNAL.test(link) || seen.has(link)) continue;
      seen.add(link);
      const target = new URL(link, `http://site${page}`);
      const path = target.pathname;
      if (!exists(path)) {
        broken.push({ page, link, reason: "no page or file" });
        continue;
      }
      const anchor = decodeURIComponent(target.hash.slice(1));
      const url = path.replace(/\/$/, "") || "/";
      if (anchor !== "" && pages.has(url) && !idsOf(url).has(anchor))
        broken.push({ page, link, reason: `no element with id "${anchor}" on ${url}` });
    }
  }
  return broken;
}
