/**
 * Stackra file contract:
 * Purpose: proves the native `PointsBalance` shows the balance and tier, warns when points expire within thirty days of
 *          mounting, and stays quiet when the expiry is further away: the same rule as the web renderer.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by DOM
 *           stand-ins; the translation returns the key itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 7); ADR 0302 (both platforms implement the contract).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { BalanceView } from "#core/schemas/balance-view.schema";
import { PointsBalance } from "#native/points-balance/points-balance";

vi.mock("@stackra/ui/native", async () => {
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
    Text: part("p"),
  };
});

vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

/** A day in milliseconds. */
const DAY = 24 * 60 * 60 * 1_000;

/** A gold balance of 420 points whose oldest points expire `days` from now. */
const balance = (days: number) =>
  BalanceView.create({
    memberId: "usr_1",
    tier: LoyaltyTier.Gold,
    balance: 420,
    nextExpiryAt: new Date(Date.now() + days * DAY),
  });

describe("PointsBalance (native)", () => {
  afterEach(cleanup);

  it("warns about an expiry within thirty days", () => {
    render(<PointsBalance data={balance(11)} isRefreshing={false} />);
    expect(screen.getByText("420")).toBeTruthy();
    expect(screen.getByText("loyalty_kit::enums.loyalty_tier.gold")).toBeTruthy();
    expect(screen.getByText("loyalty_kit::widgets.points_balance.expiry_note")).toBeTruthy();
  });

  it("shows the balance without a warning when the expiry is far away", () => {
    render(<PointsBalance data={balance(92)} isRefreshing={false} />);
    expect(screen.getByText("420")).toBeTruthy();
    expect(screen.queryByText("loyalty_kit::widgets.points_balance.expiry_note")).toBeNull();
  });
});
