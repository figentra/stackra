/**
 * Stackra file contract:
 * Purpose: `EmptyNoteUpdateError`, an update that names neither a new title nor a new text.
 * Boundary: a refusal of kind `validation` (HTTP 400, code `empty_note_update`), thrown by `UpdateNoteAction` before anything is read or written.
 * Runtime: node
 * Governing contract: ADR 0137 and 0140 (refusals, codes); ADR 0232 (transport mapping from the kind).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Nothing to change. */
export class EmptyNoteUpdateError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {}
