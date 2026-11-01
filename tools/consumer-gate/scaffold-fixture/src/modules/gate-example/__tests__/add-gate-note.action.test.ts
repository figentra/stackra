/**
 * Stackra file contract:
 * Purpose: the one test of the consumer-gate scaffold fixture: the action returns the text it is given.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1813.
 */
import { describe, expect, it } from "@stackra/testing";

import { AddGateNoteAction } from "#modules/gate-example/actions/add-gate-note.action";

describe("AddGateNoteAction", () => {
  it("returns the text", async () => {
    expect(await new AddGateNoteAction().handle({ text: "hello" })).toEqual({ text: "hello" });
  });
});
