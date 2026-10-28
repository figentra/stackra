/**
 * Stackra file contract:
 * Purpose: unit tests of `callTimeZone`: the running call's time zone through the connected resolver, and UTC outside
 *          a call or with no resolver.
 * Boundary: test only; a stand-in resolver and context storage.
 * Runtime: node (vitest)
 * Governing contract: ADR 0136 (decision 1); ADR 0022; reporting gap 10.
 */
import { ContextStorage } from "@stackra/actions/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";

import { callTimeZone } from "#core/functions/call-time-zone.function";
import { connectVisibilityFilter } from "#core/functions/connect-visibility-filter.function";

/** Connects a resolver whose context storage holds `context`. */
function connect(context: object | undefined): void {
  const storage = { current: () => context } as unknown as ContextStorage;
  connectVisibilityFilter({
    has: (token) => token === ContextStorage,
    get: () => storage,
  } as Parameters<typeof connectVisibilityFilter>[0]);
}

afterEach(() => connectVisibilityFilter(undefined));

describe(callTimeZone, () => {
  it("reads the running call's time zone", () => {
    connect({ timeZone: "Asia/Riyadh" });
    expect(callTimeZone()).toBe("Asia/Riyadh");
  });

  it("is UTC outside a call or with no resolver", () => {
    connect(undefined);
    expect(callTimeZone()).toBe("UTC");
    connectVisibilityFilter(undefined);
    expect(callTimeZone()).toBe("UTC");
  });
});
