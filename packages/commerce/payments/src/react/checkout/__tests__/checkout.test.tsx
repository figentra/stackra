/**
 * Stackra file contract:
 * Purpose: proves the Checkout draws the host's sections and choices and submits every field with the chosen shipping
 *          option and payment method.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0503.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Checkout } from "#react/checkout/checkout";

const sar = (amount: number) => ({ amount, currency: "SAR" });

describe("Checkout", () => {
  afterEach(cleanup);

  it("submits the fields, shipping and payment", () => {
    const onSubmit = vi.fn();
    const onShippingChange = vi.fn();
    render(
      <Checkout
        sections={[
          {
            id: "contact",
            title: "Contact",
            fields: [{ id: "email", label: "Email", type: "email", defaultValue: "a@b.co" }],
          },
        ]}
        shippingOptions={[
          { id: "std", label: "Standard", price: sar(0) },
          { id: "exp", label: "Express", price: sar(25) },
        ]}
        paymentMethods={[
          { id: "card", label: "Card" },
          { id: "cod", label: "Cash on delivery" },
        ]}
        lines={[{ id: "l1", name: "Abaya", quantity: 1, amount: sar(150) }]}
        totals={[{ id: "total", label: "Total", amount: sar(150), isTotal: true }]}
        labels={{
          shipping: "Shipping",
          payment: "Payment",
          summary: "Order summary",
          placeOrder: "Place order",
        }}
        onShippingChange={onShippingChange}
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByRole("group", { name: "Contact" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Express/ }));
    expect(onShippingChange).toHaveBeenCalledWith("exp");
    fireEvent.click(screen.getByRole("radio", { name: /Cash on delivery/ }));
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));
    expect(onSubmit).toHaveBeenCalledWith({
      fields: { email: "a@b.co" },
      shipping: "exp",
      payment: "cod",
    });
  });
});
