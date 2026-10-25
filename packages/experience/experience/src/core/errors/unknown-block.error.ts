/**
 * Stackra file contract:
 * Purpose: `UnknownBlockError`, the refusal of a document node whose key no block registers on this target
 *          (`unknown_block`): a block removed or renamed without `@Renamed` after the document was published.
 * Boundary: raised by `resolveDocument` before anything is drawn; kind `Validation` (HTTP 400), not retryable. It
 *           names the key and where the node sits, never the document's other content.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 6: an unknown component is refused); ADR 0140 (envelope and kinds); final
 *                     review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only registering the block, or renaming it with `@Renamed`, changes the answer.
 *
 * @example
 * throw UnknownBlockError.create({ block: "web.hero", path: "0" });
 */
export class UnknownBlockError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The key the node named. */
  block!: string;

  /** Where the node sits in the document (`0.children.2`). */
  path!: string;
}
