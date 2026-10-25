/**
 * Stackra file contract:
 * Purpose: `DocumentInvalidError`, the refusal of a document tree that is not a tree of well-formed block instances: a
 *          400 whose field errors name each refused node or field by its path.
 * Boundary: a refusal of stored or user-sent data (`parseDocumentNode`, `Editor.replace`). The field errors are
 *           snake_case codes (`node_invalid`, `id_invalid`, `id_taken`, `block_invalid`, `props_invalid`,
 *           `children_invalid`, `too_deep`, `too_many_blocks`) and never echo a refused value. The root's path is
 *           `(root)`; a nested node's is `children.0.children.2`. Whether a block is registered and its props fit is
 *           `Editor.problems`'s, not this refusal's.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 1: one format, one validator); ADR 0140 (error envelope); ADR 0328
 *                     (decision 6: `parse` refuses untrusted input).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A document tree the builder refuses.
 *
 * @example
 * throw DocumentInvalidError.create({}, { fieldErrors: { "children.0.id": "id_taken" } });
 */
export class DocumentInvalidError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
