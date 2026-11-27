/**
 * Stackra file contract:
 * Purpose: unit tests of `exitCode`: a code is kept, a signal reports 128 plus its number, nothing at all is 1.
 * Boundary: pure function under test.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0022 (test placement).
 */
import { exitCode } from "#node/functions/exit-code.function";

describe("exitCode", () => {
  it("keeps a code, maps a signal as a shell does, and is 1 otherwise", () => {
    expect(exitCode(0, null)).toBe(0);
    expect(exitCode(4, null)).toBe(4);
    expect(exitCode(null, "SIGINT")).toBe(130);
    expect(exitCode(null, "SIGTERM")).toBe(143);
    expect(exitCode(null, null)).toBe(1);
  });
});
