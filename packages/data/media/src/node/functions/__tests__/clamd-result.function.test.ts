/**
 * Stackra file contract:
 * Purpose: unit tests of `clamdResult`: OK, FOUND with the signature name, ERROR and an empty reply.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0354.
 */
import { describe, expect, it } from "@stackra/testing";

import { clamdResult } from "#node/functions/clamd-result.function";

describe(clamdResult, () => {
  it("maps clamd's replies", () => {
    expect(clamdResult("stream: OK\0")).toEqual({ verdict: "clean", threats: [] });
    expect(clamdResult("stream: Eicar-Signature FOUND\0")).toEqual({
      verdict: "infected",
      threats: ["Eicar-Signature"],
    });
    expect(clamdResult("INSTREAM size limit exceeded. ERROR\0")).toEqual({
      verdict: "failed",
      threats: [],
      detail: "INSTREAM size limit exceeded. ERROR",
    });
    expect(clamdResult("")).toMatchObject({ verdict: "failed", detail: "no reply" });
  });
});
