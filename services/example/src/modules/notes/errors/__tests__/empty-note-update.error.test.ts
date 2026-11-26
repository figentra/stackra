/**
 * Stackra file contract:
 * Purpose: unit tests of `EmptyNoteUpdateError`: a validation refusal with the stable code `empty_note_update` and HTTP status 400.
 * Boundary: test only; reads the refusal's envelope.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import { describe, expect, it } from "@stackra/testing";

import { EmptyNoteUpdateError } from "#modules/notes/errors/empty-note-update.error";

/** The empty-update refusal. */
describe(EmptyNoteUpdateError, () => {
  /** The code is derived from the class name; the kind fixes the status. */
  it("is a 400 validation refusal with the code empty_note_update", () => {
    const error = EmptyNoteUpdateError.create();
    expect(error.code).toBe("empty_note_update");
    expect(error.kind).toBe("validation");
    expect(error.retryable).toBe(false);
  });
});
