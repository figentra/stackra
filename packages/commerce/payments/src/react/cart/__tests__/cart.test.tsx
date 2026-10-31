/**
 * Stackra file contract:
 * Purpose: proves the Cart shows lines with their amounts and the host's totals, reports quantity changes, removal and
 *          checkout, and shows the empty words with no button when there are no lines.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Cart } from "#react/cart/cart";

const LABELS = {
  title: "Cart",
  empty: "Your cart is empty",
  quantity: (name: string) => `Quantity of ${name}`,
  remove: "Remove",
  checkout: "Checkout",
};
const LINES = [
  { id: "l1", name: "Linen abaya", unitPrice: { amount: 150, currency: "SAR" }, quantity: 2 },
];
const TOTALS = [
  { id: "total", label: "Total", amount: { amount: 300, currency: "SAR" }, isTotal: true },
];

describe("Cart", () => {
  afterEach(cleanup);

  it("reports quantity, removal and checkout", () => {
    const [onQuantityChange, onRemove, onCheckout] = [vi.fn(), vi.fn(), vi.fn()];
    render(
      <Cart
        lines={LINES}
        totals={TOTALS}
        labels={LABELS}
        onQuantityChange={onQuantityChange}
        onRemove={onRemove}
        onCheckout={onCheckout}
      />,
    );
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getByRole("group", { name: "Quantity of Linen abaya" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Increase/ }));
    expect(onQuantityChange).toHaveBeenCalledWith("l1", 3);
    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    expect(onCheckout).toHaveBeenCalled();
  });

  it("shows the empty words and no checkout", () => {
    render(
      <Cart
        lines={[]}
        totals={[]}
        labels={LABELS}
        onQuantityChange={() => {}}
        onRemove={() => {}}
        onCheckout={() => {}}
      />,
    );
    expect(screen.getByText("Your cart is empty")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Checkout" })).toBeNull();
  });
});
