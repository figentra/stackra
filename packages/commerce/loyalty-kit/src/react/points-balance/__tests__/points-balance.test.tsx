/**
 * Stackra file contract:
 * Purpose: proves the web `PointsBalance` shows the balance and the tier's label, warns when points expire within
 *          thirty days of mounting, stays quiet beyond, and shows zero with no tier while loading.
 * Boundary: unit tier, jsdom. `@stackra/ui/react` is replaced by DOM stand-ins so the test reads plain elements, and the
 *           translation returns the key itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 7).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { BalanceView } from "#core/schemas/balance-view.schema";
import { PointsBalance } from "#react/points-balance/points-balance";

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  const part = (tag: string) => (props: { readonly children?: ReactNode }) =>
    createElement(tag, null, props.children);
  return {
    Card: Object.assign(part("section"), {
      Header: part("header"),
      Title: part("h3"),
      Content: part("div"),
    }),
    Chip: part("mark"),
    Text: (props: { readonly children?: ReactNode; readonly tone?: string }) =>
      createElement("p", { "data-tone": props.tone ?? "default" }, props.children),
  };
});

vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

/** A day in milliseconds. */
const DAY = 24 * 60 * 60 * 1000;

/** A gold balance of 1 000 points whose oldest points expire `days` from now. */
const balance = (days: number) =>
  BalanceView.create({
    memberId: "usr_1",
    tier: LoyaltyTier.Gold,
    balance: 1000,
    nextExpiryAt: new Date(Date.now() + days * DAY),
  });

describe("PointsBalance", () => {
  afterEach(cleanup);

  it("shows the balance and tier, and warns about an expiry within thirty days", () => {
    render(<PointsBalance data={balance(11)} isRefreshing={false} />);
    expect(screen.getByText("1000")).toBeTruthy();
    expect(screen.getByText("loyalty_kit::enums.loyalty_tier.gold")).toBeTruthy();
    expect(
      screen.getByText("loyalty_kit::widgets.points_balance.expiry_note").dataset["tone"],
    ).toBe("warning");
  });

  it("stays quiet when the expiry is further away", () => {
    render(<PointsBalance data={balance(90)} isRefreshing={false} />);
    expect(screen.queryByText("loyalty_kit::widgets.points_balance.expiry_note")).toBeNull();
  });

  it("shows zero and no tier while loading", () => {
    render(<PointsBalance isRefreshing />);
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.queryByText(/loyalty_tier/)).toBeNull();
  });
});
