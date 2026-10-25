/**
 * Stackra file contract:
 * Purpose: proves freezeIds replays one byte stream through `crypto.getRandomValues` for any integer typed array,
 *          restarts it on each call, and restores the real source after the test or at once on request.
 * Boundary: the global `crypto` of the test worker; imports no id minting (ADR 0269 decision 2).
 * Runtime: node
 * Governing contract: ADR 0269 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { freezeIds } from "#core/functions/freeze-ids.function";

/** Sixteen bytes from the current random source. */
const draw = (): number[] => [...crypto.getRandomValues(new Uint8Array(16))];

// @covers sta-348:FR-004
describe(freezeIds, () => {
  it("replays the same bytes after every call", () => {
    freezeIds();
    const first = draw();
    const second = draw();
    freezeIds();
    expect(draw()).toEqual(first);
    expect(draw()).toEqual(second);
    expect(second).not.toEqual(first);
  });

  it("fills the given array in place and returns it, for any integer typed array", () => {
    freezeIds();
    const words = new Uint32Array(4);
    expect(crypto.getRandomValues(words)).toBe(words);
    expect([...words].some((word) => word !== 0)).toBe(true);
  });

  it("fills only the view's own bytes", () => {
    freezeIds();
    const buffer = new Uint8Array(8);
    crypto.getRandomValues(new Uint8Array(buffer.buffer, 2, 4));
    expect([buffer[0], buffer[1], buffer[6], buffer[7]]).toEqual([0, 0, 0, 0]);
  });

  it("restores the real source when the previous test finished", () => {
    expect(vi.isMockFunction(crypto.getRandomValues)).toBe(false);
  });

  it("restores at once through the returned function", () => {
    const restore = freezeIds();
    expect(vi.isMockFunction(crypto.getRandomValues)).toBe(true);
    restore();
    expect(vi.isMockFunction(crypto.getRandomValues)).toBe(false);
  });
});
