/**
 * Stackra file contract:
 * Purpose: unit tests of `handleSkipWaiting`: `{ type: "skip_waiting" }` activates the waiting worker; any other
 *          message is ignored.
 * Boundary: test only; the worker scope's `skipWaiting` is stubbed on `globalThis`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { handleSkipWaiting } from "#sw/functions/handle-skip-waiting.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("handleSkipWaiting", () => {
  it("activates the waiting worker on request only", () => {
    const skipWaiting = vi.fn(async () => undefined);
    vi.stubGlobal("skipWaiting", skipWaiting);
    const waitUntil = vi.fn();
    handleSkipWaiting({ data: { type: "hello" }, waitUntil });
    handleSkipWaiting({ data: null, waitUntil });
    expect(skipWaiting).not.toHaveBeenCalled();
    handleSkipWaiting({ data: { type: "skip_waiting" }, waitUntil });
    expect(skipWaiting).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });
});
