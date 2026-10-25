/**
 * Stackra file contract:
 * Purpose: `ResourcePage`, the pages of a resource, which follow from its operations.
 * Boundary: an enum (`Enum.of`); `.then(page)` on a create placement names where the panel goes after a create.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 23: List, Create, Edit, View); ADR 0307 (rule 3); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A resource page.
 *
 * @example
 * a.create().then(ResourcePage.View)
 */
export const ResourcePage = Enum.of({
  /** The table, its views and its filters. */
  List: "list",
  /** The create form. */
  Create: "create",
  /** The edit form; it exists only when the resource has an `update` operation. */
  Edit: "edit",
  /** The record's infolist, relations and activity. */
  View: "view",
});

/** One of the codes above. */
export type ResourcePage = Enum.Value<typeof ResourcePage>;
