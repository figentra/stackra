/**
 * Stackra file contract:
 * Purpose: `pagesPlugin`, the Vite plugin of the per-locale HTML pages gen writes under `.stackra/`: the dev server
 *          answers a page navigation under a locale prefix (`/ar-sa/orders`) with that locale's page, and the build
 *          moves each page from its generated path (`.stackra/ar-sa/index.html`) to its prefix (`ar-sa/index.html`),
 *          keeping a relative base's asset URLs pointing at the same files.
 * Boundary: client environment only. The longest matching prefix wins, so `/` is the fallback page. Only navigations
 *           (an `Accept: text/html` GET or HEAD) are rewritten; module, asset and Vite requests pass through. The
 *           pages' content is gen's; this plugin never edits it beyond the relative URL depth.
 * Runtime: node
 * Governing contract: ADR 0297 (decision 4: a locale is its URL prefix), ADR 0295 (decision 5: gen writes
 *                     `index.html` per locale), ADR 0249 (the desktop renderer's relative base).
 */
import { posix } from "node:path";

import type { Plugin } from "vite";

/** One page: its generated HTML file (relative to the member root) and the prefix it answers. */
type Page = { readonly html: string; readonly path: string };

/** The output file of a page answering `prefix` (`/` → `index.html`, `/ar-sa/` → `ar-sa/index.html`). */
function outputOf(prefix: string): string {
  return `${prefix.slice(1)}index.html`;
}

/** The folder depth of an output file name (`index.html` → 0, `.stackra/ar/index.html` → 2). */
function depthOf(fileName: string): number {
  return fileName.split("/").length - 1;
}

/** Rewrites relative URLs written for a page `from` folders deep so they resolve `to` folders deep. */
function relocate(html: string, from: number, to: number): string {
  if (from === to || from === 0) return html;
  const up = new RegExp(`(["'(=]\\s*)${"\\.\\./".repeat(from)}`, "g");
  return html.replace(up, `$1${to === 0 ? "./" : "../".repeat(to)}`);
}

/**
 * The plugin that serves and places the per-locale pages.
 *
 * @param pages - every page, in any order.
 * @example
 * pagesPlugin([{ html: ".stackra/index.html", path: "/" }, { html: ".stackra/ar/index.html", path: "/ar/" }]);
 * // dev: GET /ar/orders (text/html) → .stackra/ar/index.html; build: .stackra/ar/index.html → ar/index.html
 */
export function pagesPlugin(pages: readonly Page[]): Plugin {
  const byPrefix = [...pages].sort((a, b) => b.path.length - a.path.length);
  let isRelativeBase = false;
  return {
    name: "stackra:pages",
    applyToEnvironment: (environment) => environment.config.consumer === "client",
    configResolved(config) {
      isRelativeBase = config.base === "" || config.base.startsWith(".");
    },
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const isNavigation =
          (request.method === "GET" || request.method === "HEAD") &&
          (request.headers.accept ?? "").includes("text/html");
        const pathname = (request.url ?? "/").split("?")[0] ?? "/";
        const page = isNavigation
          ? byPrefix.find(({ path }) => pathname.startsWith(path) || `${pathname}/` === path)
          : undefined;
        if (page !== undefined) request.url = `/${page.html}`;
        next();
      });
    },
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        for (const page of pages) {
          const generated = posix.normalize(page.html);
          const asset = bundle[generated];
          if (asset === undefined || asset.type !== "asset") continue;
          const fileName = outputOf(page.path);
          const source =
            isRelativeBase && typeof asset.source === "string"
              ? relocate(asset.source, depthOf(generated), depthOf(fileName))
              : asset.source;
          delete bundle[generated];
          this.emitFile({ type: "asset", fileName, source });
        }
      },
    },
  };
}
