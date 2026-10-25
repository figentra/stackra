/**
 * Stackra file contract:
 * Purpose: `ResourceOperations`, which operations a resource has: `true` for one gen writes over the model's service, or the
 *          hand-written query or action class. The pages follow from them.
 * Boundary: a type only. List and navigation need the list query's permission, View the get query's.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (0294 note: pages follow from operations); ADR 0307 (rule 4).
 */
import type { AnyClass } from "@stackra/container";

/** A resource's operations. */
export interface ResourceOperations {
  /** The list query; the List page. */
  readonly list?: true | AnyClass;

  /** The get query; the View page. */
  readonly get?: true | AnyClass;

  /** The create action; the Create page. */
  readonly create?: true | AnyClass;

  /** The update action; the Edit page. */
  readonly update?: true | AnyClass;

  /** The delete action; on the row overflow, the View header and the bulk bar. */
  readonly delete?: true | AnyClass;
}
