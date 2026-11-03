/**
 * Stackra file contract:
 * Purpose: `ResourceWireInvalidError` (`resource_wire_invalid`), the refusal of a resource tree sent as JSON that does
 *          not match `ResourceWire$`, or that names an action or query key the client has no ref for.
 * Boundary: a refusal (`validation`), not retryable as is: the sender fixes the tree, or the client is regenerated with
 *           the refs it names. `issues` lists every problem, each as `<path>: <what is wrong>`.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (refusals); ADR 0328 (built with `create`); ADR 0307 (rule 5); the SDUI catalogue case
 *                     `resources` (STA-1981, build-list item 54).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A resource tree sent as JSON cannot be drawn. */
export class ResourceWireInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The resource key (`orders.order`). */
  resource!: string;

  /** Every problem found, as `<path>: <what is wrong>`. */
  issues!: readonly string[];
}
