/**
 * Stackra file contract:
 * Purpose: `PageContextModal`, what a page publishes about the action modal that is open: the action's key and the
 *          keys of the fields it shows.
 * Boundary: a shape class; it registers this package's own schema for itself when the module loads. Keys only, never
 *           what the user typed (ADR 0490 decision 5).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decision 5); ADR 0305 (one declaration per file); STA-1631.
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { PAGE_CONTEXT_MODAL_SCHEMA } from "#core/constants/page-context-modal-schema.constant";

/**
 * The open action modal of one page.
 *
 * @example
 * PageContextModal.create({ action: "orders.order.cancel", fields: ["reason"] });
 */
export class PageContextModal extends Schema {
  /** The action's key. */
  action!: string;

  /** The keys of the fields the modal shows. */
  fields!: string[];
}

registerSchemas([[PageContextModal, PAGE_CONTEXT_MODAL_SCHEMA]]);
