// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the native `useNavigate`: `to` pushes the route key's screen with its params, `replace`
 *          dispatches a stack replace, `back` goes back, and the object is stable.
 * Boundary: test only; React Navigation is replaced by a recording stand-in, since it does not run in vitest.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0165 (React Navigation on mobile).
 */
import { describe, expect, it } from "@stackra/testing";
import { renderHook } from "@testing-library/react";
import { vi } from "vitest";

import { routeRef } from "#core/functions/route-ref.function";
import { useNavigate } from "#native/navigate/use-navigate";

const navigation = vi.hoisted(() => ({
  navigate: vi.fn(),
  dispatch: vi.fn(),
  goBack: vi.fn(),
}));

vi.mock("@react-navigation/native", () => ({
  useNavigation: () => navigation,
  StackActions: {
    replace: (name: string, params?: object) => ({ type: "REPLACE", payload: { name, params } }),
  },
}));

describe("useNavigate (native)", () => {
  it("pushes, replaces and goes back by route key", () => {
    const { result, rerender } = renderHook(() => useNavigate());
    const first = result.current;
    result.current.to(routeRef("order_detail"), { orderId: "ord_1" });
    expect(navigation.navigate).toHaveBeenCalledWith("order_detail", { orderId: "ord_1" });
    result.current.replace(routeRef("create_order"), { variantId: "var_1" });
    expect(navigation.dispatch).toHaveBeenCalledWith({
      type: "REPLACE",
      payload: { name: "create_order", params: { variantId: "var_1" } },
    });
    result.current.back();
    expect(navigation.goBack).toHaveBeenCalledOnce();
    rerender();
    expect(result.current).toBe(first);
  });
});
