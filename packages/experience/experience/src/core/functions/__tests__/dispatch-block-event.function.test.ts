/**
 * Stackra file contract:
 * Purpose: unit tests of `dispatchBlockEvent`: a navigate verb reaches `onNavigate` with its route key, an action verb
 *          reaches `onAction` whole, and a verb with no handler is dropped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0110 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { dispatchBlockEvent } from "#core/functions/dispatch-block-event.function";

describe("dispatchBlockEvent", () => {
  it("hands each verb to its handler", () => {
    const onNavigate = vi.fn();
    const onAction = vi.fn();
    const action = { verb: "action", key: "orders.order.create@1", input: { lines: [] } } as const;
    dispatchBlockEvent({ verb: "navigate", route: "create_order" }, { onNavigate, onAction });
    dispatchBlockEvent(action, { onNavigate, onAction });
    expect(onNavigate).toHaveBeenCalledWith("create_order");
    expect(onAction).toHaveBeenCalledWith(action);
  });

  it("drops a verb with no handler", () => {
    expect(() =>
      dispatchBlockEvent({ verb: "action", key: "orders.order.create@1" }, {}),
    ).not.toThrow();
  });
});
