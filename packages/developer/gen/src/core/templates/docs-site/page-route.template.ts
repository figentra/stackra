/**
 * Stackra file contract:
 * Purpose: `PAGE_ROUTE_TEMPLATE`, the `app/routes/page.tsx` of a generated Fumadocs site: the loader finds the page
 *          of the path (404 when there is none), and the component renders it in the docs layout with the navigation
 *          gen wrote into `app/site.json`, its table of contents and the site footer.
 * Boundary: a constant; the loader runs only while prerendering (`ssr: false`).
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026 (the navigation comes from the DocsConfig).
 */

/** The emitted `app/routes/page.tsx`. */
export const PAGE_ROUTE_TEMPLATE = `import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { use } from "react";

import { Footer } from "../components/footer";
import { baseOptions } from "../lib/layout";
import { docs, source } from "../lib/source";
import { mdxComponents } from "../mdx-components";
import site from "../site.json";

/** A home page's file: index.mdx at the root, or a language's index.<lang>.mdx. */
const HOME_PAGE = /^index(\\.[A-Za-z-]+)?\\.mdx?$/;

export function loader({ params }: { readonly params: Readonly<Record<string, string | undefined>> }) {
  const slugs = (params["*"] ?? "").split("/").filter((slug) => slug.length > 0);
  const page = source.getPage(slugs);
  if (page === undefined) throw new Response("Not found", { status: 404 });
  return { path: page.path };
}

function Content({ path }: { readonly path: string }) {
  const page = docs.getPage(path);
  if (page === undefined) throw new Response("Not found", { status: 404 });
  const { toc } = use(page.load());
  const Body = page.body;
  // The home page (index.mdx, or index.<lang>.mdx) is titled by its own words alone: they already name the site.
  const title = HOME_PAGE.test(path) ? page.title : page.title + " · " + site.name;
  return (
    <DocsPage toc={toc}>
      <title>{title}</title>
      {page.description === undefined ? null : <meta name="description" content={page.description} />}
      <DocsTitle>{page.title}</DocsTitle>
      <DocsDescription>{page.description}</DocsDescription>
      <DocsBody>
        <Body components={mdxComponents} />
      </DocsBody>
      <Footer />
    </DocsPage>
  );
}

export default function Page({ loaderData }: { readonly loaderData: { readonly path: string } }) {
  return (
    <DocsLayout {...baseOptions()} tree={site.tree}>
      <Content path={loaderData.path} />
    </DocsLayout>
  );
}
`;
