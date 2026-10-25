/**
 * Stackra file contract:
 * Purpose: unit tests of `defineWorker`: it returns its argument unchanged.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0295 (decision 1).
 */
import { describe, expect, it } from "@stackra/testing";

import { defineWorker } from "#core/functions/define-worker.function";

describe("defineWorker", () => {
  it("returns the definition unchanged", () => {
    const definition = {};
    expect(defineWorker(definition)).toBe(definition);
  });
});
