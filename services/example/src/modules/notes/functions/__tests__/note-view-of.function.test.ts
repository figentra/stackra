/**
 * Stackra file contract:
 * Purpose: unit tests of `noteViewOf`: it copies the five fields a caller may see and nothing else.
 * Boundary: test only; a stored `Note` stand-in carrying a tenant id the view must not.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0294 (as amended by programming model v3.1, AGENTS.md).
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { noteViewOf } from "#modules/notes/functions/note-view-of.function";
import { Note } from "#modules/notes/models/note.model";

const stored = Object.assign(new Note(), {
  id: "not_01ja0000000000000000000001" as PublicId<"not">,
  tenantId: "scp_01ja0000000000000000000009",
  title: "Buy milk",
  body: "Two litres",
  createdAt: new Date("2026-11-02T08:00:00.000Z"),
  updatedAt: new Date("2026-11-03T09:30:00.000Z"),
});

/** The note view. */
describe(noteViewOf, () => {
  /** Exactly the five caller-facing fields. */
  it("copies id, title, body and both times, and nothing of the tenant", () => {
    const view = { ...noteViewOf(stored) };
    expect(view).toEqual({
      id: stored.id,
      title: "Buy milk",
      body: "Two litres",
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    });
    expect(Object.keys(view)).not.toContain("tenantId");
  });
});
