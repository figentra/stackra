/**
 * Stackra file contract:
 * Purpose: `PageContext`, what the SDK sends with each AI turn about the screen the user is on: the app, the route and
 *          its params, and the record, selection, filters, view and open modal when the page declares them.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. A pointer, not
 *           evidence: public ids and declared keys only, never record field values and never a field the user cannot
 *           see. The server resolves it under the caller's permissions (`resolvePageContext`, ADR 0490 decision 6).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 5 and 6); ADR 0305 (one declaration per file); STA-1631.
 */
import type { Json, PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { PAGE_CONTEXT_SCHEMA } from "#core/constants/page-context-schema.constant";
import type { PageContextModal } from "#core/schemas/page-context-modal.schema";
import type { PageContextSelection } from "#core/schemas/page-context-selection.schema";

/**
 * The page context of one turn.
 *
 * @example
 * PageContext.create({ app: "console", route: "order_detail", params: { orderId }, record: orderId });
 */
export class PageContext extends Schema {
  /** The app member's key. */
  app!: string;

  /** The route key (`order_detail`). */
  route!: string;

  /** The route's path parameters. */
  params!: Record<string, string>;

  /** The record the page is about. */
  record?: PublicId;

  /** The rows the user selected. */
  selection?: PageContextSelection;

  /** The list filters, by declared filter key. */
  filters?: Record<string, Json>;

  /** The saved view's key. */
  view?: string;

  /** The open action modal. */
  modal?: PageContextModal;
}

registerSchemas([[PageContext, PAGE_CONTEXT_SCHEMA]]);
