/**
 * Stackra file contract:
 * Purpose: `ResourceRoutesOptions`, the second argument of `resource(key, options)` in the generated `#stackra/resources`:
 *          the base path and the client refs of the resource's operations.
 * Boundary: a type only; a page exists when its operation does (List always, View with `view`, Create with `create`, Edit
 *           with `update`).
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (0294 note: pages follow from operations); ADR 0307.
 */
import type { AnyClass } from "@stackra/container";

/** What a resource's route constants are built from. */
export interface ResourceRoutesOptions {
  /** The list path (`/orders/orders`). */
  readonly base: string;

  /** The list query ref. */
  readonly list?: AnyClass;

  /** The get query ref; the View page exists with it. */
  readonly view?: AnyClass;

  /** The create action ref; the Create page exists with it. */
  readonly create?: AnyClass;

  /** The update action ref; the Edit page exists with it. */
  readonly update?: AnyClass;

  /** The read permission the list and navigation need. */
  readonly permission?: string;
}
