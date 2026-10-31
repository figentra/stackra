/**
 * Stackra file contract:
 * Purpose: proves the FeatureSection is a section named by its title and lists each feature with its words.
 * Boundary: unit tier, jsdom, the real @stackra/ui components.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";

import { FeatureSection } from "#react/feature-section/feature-section";

describe("FeatureSection", () => {
  afterEach(cleanup);

  it("lists the features under a named section", () => {
    render(
      <FeatureSection
        eyebrow="Why us"
        title="Everything a shop needs"
        features={[
          { id: "pay", title: "Payments", description: "Cards and wallets.", icon: "credit-card" },
          { id: "ship", title: "Shipping", description: "Every carrier." },
        ]}
      />,
    );
    expect(screen.getByRole("region", { name: "Everything a shop needs" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Cards and wallets.")).toBeTruthy();
  });
});
