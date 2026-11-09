/**
 * Stackra file contract:
 * Purpose: `SOURCE_TEMPLATE`, the `app/lib/source.ts` of a generated Fumadocs site: the `content/` collection, loaded
 *          lazily in the browser, and the Fumadocs source over it with pages at the site root.
 * Boundary: a constant; the page tree the layout shows is gen's (`app/site.json`), not the source's.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 1); STA-2026.
 */

/** The emitted `app/lib/source.ts`. */
export const SOURCE_TEMPLATE = `import { loader } from "fumadocs-core/source";
import { defineDocs } from "fumadocs-mdx/macro";

export const docs = defineDocs({ dir: "content", docs: { async: true } });

export const source = loader({ source: docs.toFumadocsSource(), baseUrl: "/" });
`;
