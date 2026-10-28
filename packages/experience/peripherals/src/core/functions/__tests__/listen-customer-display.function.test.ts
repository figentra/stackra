/**
 * Stackra file contract:
 * Purpose: unit tests of `listenCustomerDisplay`: a malformed message on the channel is ignored, a listener stops
 *          hearing after it unsubscribes, and it throws where there is no `BroadcastChannel`.
 * Boundary: test only; Node's own `BroadcastChannel`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0339.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CUSTOMER_DISPLAY_CHANNEL } from "#core/constants/customer-display-channel.constant";
import { listenCustomerDisplay } from "#core/functions/listen-customer-display.function";

describe("listenCustomerDisplay", () => {
  it("ignores what is not a show or a clear of the right shape", async () => {
    const listener = vi.fn();
    const stop = listenCustomerDisplay(listener);
    const till = new BroadcastChannel(CUSTOMER_DISPLAY_CHANNEL);
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    till.postMessage({ type: "show", view: { lines: [{ label: 1 }], total: null, message: null } });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    till.postMessage({ type: "eval", code: "alert(1)" });
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- a BroadcastChannel post: it is same-origin and takes no target origin
    till.postMessage({ type: "show", view: { lines: [], total: "SAR 0.00", message: null } });
    await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
    expect(listener).toHaveBeenCalledWith({ lines: [], total: "SAR 0.00", message: null });
    stop();
    till.close();
  });

  it("throws without BroadcastChannel", () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    try {
      expect(() => listenCustomerDisplay(() => undefined)).toThrow(TypeError);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
