/**
 * Stackra file contract:
 * Purpose: `I18N_PAGE_ROUTE_TEMPLATE`, the `app/routes/page.tsx` of a generated multi-language Fumadocs site: every
 *          page of every locale (a translated page is the page under `/<code>/`), in the docs layout with the
 *          navigation of the page's locale.
 * Boundary: a constant; the loader runs only while prerendering (`ssr: false`). Emitted only when the DocsConfig sets
 *           `locales`; a single-language site keeps `PAGE_ROUTE_TEMPLATE`.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (Fumadocs docs sites).
 */

/** The emitted `app/routes/page.tsx` of a multi-language site. */
export const I18N_PAGE_ROUTE_TEMPLATE = `import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { use } from "react";

import { Footer } from "../components/footer";
import { baseOptions } from "../lib/layout";
import { localeOf } from "../lib/locale";
import { docs, source } from "../lib/source";
import { mdxComponents } from "../mdx-components";
import site from "../site.json";

/** A home page's file: index.mdx at the root, or a language's index.<lang>.mdx. */
const HOME_PAGE = /^index(\\.[A-Za-z-]+)?\\.mdx?$/;

const trees = site.trees as Readonly<Record<string, typeof site.tree>>;

export function loader({ params }: { readonly params: Readonly<Record<string, string | undefined>> }) {
  const slugs = (params["*"] ?? "").split("/").filter((slug) => slug.length > 0);
  const page = source.getPage(slugs);
  if (page === undefined) throw new Response("Not found", { status: 404 });
  return { path: page.path, url: "/" + slugs.join("/") };
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

export default function Page({
  loaderData,
}: {
  readonly loaderData: { readonly path: string; readonly url: string };
}) {
  const locale = localeOf(loaderData.url);
  return (
    <DocsLayout {...baseOptions(locale)} tree={trees[locale.code] ?? site.tree}>
      <Content path={loaderData.path} />
    </DocsLayout>
  );
}
`;
