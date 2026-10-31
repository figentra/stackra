/**
 * Stackra file contract:
 * Purpose: proves the PricingTable shows each plan's price for the selected period, switches period, marks the
 *          featured plan and reports the chosen plan with the period.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { PricingTable } from "#react/pricing-table/pricing-table";

const sar = (amount: number) => ({ amount, currency: "SAR" });
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    prices: { month: sar(49), year: sar(490) },
    features: ["One shop"],
    cta: "Choose Basic",
  },
  {
    id: "pro",
    name: "Pro",
    prices: { month: sar(99), year: sar(990) },
    features: ["Three shops"],
    cta: "Choose Pro",
    badge: "Popular",
    isFeatured: true,
  },
];
const PERIODS = [
  { id: "month", label: "Monthly", suffix: "/ month" },
  { id: "year", label: "Yearly", suffix: "/ year" },
];

describe("PricingTable", () => {
  afterEach(cleanup);

  it("prices each plan for the period, and the choice carries the period", () => {
    const onSelect = vi.fn();
    render(
      <PricingTable plans={PLANS} periods={PERIODS} periodLabel="Billing" onSelect={onSelect} />,
    );
    expect(screen.getAllByText("/ month")).toHaveLength(2);
    expect(screen.getByText("Popular")).toBeTruthy();
    expect(screen.getByRole("article", { name: "Pro" }).hasAttribute("data-featured")).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Yearly" }));
    expect(screen.getAllByText("/ year")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Choose Pro" }));
    expect(onSelect).toHaveBeenCalledWith("pro", "year");
  });

  it("hides the switch for one period", () => {
    render(
      <PricingTable
        plans={PLANS}
        periods={PERIODS.slice(0, 1)}
        periodLabel="Billing"
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });
});
