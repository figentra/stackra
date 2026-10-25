/**
 * Stackra file contract:
 * Purpose: `DocumentKind`, the kinds of a panel document: a Page or a Dashboard.
 * Boundary: an enum (`Enum.of`) written in `Document({ kind })`; a Dashboard places widget classes only, on the 12-column
 *           grid, while a Page holds any registered block.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 20: dashboards); ADR 0294 (decision 23: a page is a document of kind Page); ADR 0294
 *                     (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * What a document is.
 *
 * @example
 * export class SalesOverviewDocument extends Document({ kind: DocumentKind.Dashboard, blocks }) {}
 */
export const DocumentKind = Enum.of({
  /** A block tree a route renders. */
  Page: "page",
  /** Widget tiles on the 12-column grid, under one range picker. */
  Dashboard: "dashboard",
});

/** One of the codes above. */
export type DocumentKind = Enum.Value<typeof DocumentKind>;
