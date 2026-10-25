/**
 * Stackra file contract:
 * Purpose: unit tests of `ChannelCustomerDisplayDriver` with `listenCustomerDisplay`: a view and a clear posted by the
 *          till reach the display side of the same channel, and the driver refuses on `window` where there is no
 *          `BroadcastChannel`.
 * Boundary: test only; Node's own `BroadcastChannel` carries the messages within the test process.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0339 (decision 1 and open question 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import { ChannelCustomerDisplayDriver } from "#core/drivers/channel-customer-display.driver";
import { listenCustomerDisplay } from "#core/functions/listen-customer-display.function";

const VIEW: CustomerDisplayView = {
  lines: [{ label: "Latte", amount: "SAR 18.00" }],
  total: "SAR 18.00",
  message: "Thank you",
};

describe("ChannelCustomerDisplayDriver", () => {
  it("delivers views and clears to the display side", async () => {
    const seen: (CustomerDisplayView | null)[] = [];
    const stop = listenCustomerDisplay((view) => seen.push(view));
    const display = new ChannelCustomerDisplayDriver();
    expect(await display.probe()).toEqual({ ok: true, data: undefined });
    expect(await display.show(VIEW)).toEqual({ ok: true, data: undefined });
    await display.clear();
    await vi.waitFor(() => expect(seen).toEqual([VIEW, null]));
    stop();
    display.close();
  });

  it("refuses without BroadcastChannel", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    try {
      const display = new ChannelCustomerDisplayDriver();
      const refused = { ok: false, error: { code: "unavailable", capability: "window" } };
      expect(await display.probe()).toEqual(refused);
      expect(await display.show(VIEW)).toEqual(refused);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
