/**
 * Stackra file contract:
 * Purpose: `RoutePageContext`, the page context a route publishes with each AI turn (`Route({ context: { ... } })`):
 *          the record its `:param` names, and whether it publishes a selection, filters, a view and a modal.
 * Boundary: a type only; static data gen reads from the syntax tree. It names what the page holds, never a value: the
 *           SDK sends public ids and declared keys, and the server resolves them under the caller's permissions. The
 *           `param` is checked by gen to be a path segment holding a public id (`context_record_not_public_id`). Panel
 *           pages publish theirs with no declaration.
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 5 and 6); STA-1631.
 */

/** What a route publishes as page context. */
export interface RoutePageContext {
  /** The record the page is about: its model key (`orders.order`) and the `:param` segment holding its public id. */
  readonly record?: { readonly model: string; readonly param: string };

  /** Whether the page publishes the ids the user selected. */
  readonly selection?: boolean;

  /** Whether the page publishes its list filters. */
  readonly filters?: boolean;

  /** Whether the page publishes its saved-view key. */
  readonly view?: boolean;

  /** Whether the page publishes the open action modal (its action and field keys). */
  readonly modal?: boolean;
}
