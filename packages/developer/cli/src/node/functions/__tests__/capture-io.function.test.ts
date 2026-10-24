/**
 * Stackra file contract:
 * Purpose: unit tests of `captureIo`: output and errors are collected interleaved, and tools do not inherit stdio.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0282 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { captureIo } from "#node/functions/capture-io.function";

describe("captureIo", () => {
  it("collects out and err in arrival order and never inherits", () => {
    const { io, output } = captureIo();
    io.out("a\n");
    io.err("b\n");
    io.out("c\n");
    expect(output()).toBe("a\nb\nc\n");
    expect(io.inherit).toBe(false);
  });

  it("starts empty and keeps runs apart", () => {
    const first = captureIo();
    const second = captureIo();
    first.io.out("x");
    expect(second.output()).toBe("");
  });
});
