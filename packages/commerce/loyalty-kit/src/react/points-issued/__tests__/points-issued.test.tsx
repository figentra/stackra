/**
 * Stackra file contract:
 * Purpose: proves the web `PointsIssued` shows today's earned points and the redeemed points as a negative chip, and
 *          zeros while loading.
 * Boundary: unit tier, jsdom. `@stackra/ui/react` is replaced by DOM stand-ins, and the translation returns the key
 *           itself.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 7).
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { PointsIssuedView } from "#core/schemas/points-issued-view.schema";
import { PointsIssued } from "#react/points-issued/points-issued";

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
    Text: part("p"),
  };
});

vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

describe("PointsIssued", () => {
  afterEach(cleanup);

  it("renders earned and redeemed from the points-issued view", () => {
    render(
      <PointsIssued
        data={PointsIssuedView.create({ earned: 420, redeemed: 60 })}
        isRefreshing={false}
      />,
    );
    expect(screen.getByText("loyalty_kit::widgets.points_issued.title")).toBeTruthy();
    expect(screen.getByText("420")).toBeTruthy();
    expect(screen.getByText("−60")).toBeTruthy();
  });

  it("shows zeros while loading", () => {
    render(<PointsIssued isRefreshing />);
    expect(screen.getByText("0")).toBeTruthy();
    expect(screen.getByText("−0")).toBeTruthy();
  });
});
