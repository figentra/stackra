/**
 * Stackra file contract:
 * Purpose: proves the RuledBand draws one blueprint band in the landing's padding, named and anchored when asked,
 *          and draws no second band for a block nested inside another.
 * Boundary: unit tier, jsdom, the real @stackra/ui `BlueprintSection`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render, screen } from "@testing-library/react";

import { RuledBand } from "#react/ruled-band/ruled-band";

describe("RuledBand", () => {
  afterEach(cleanup);

  it("is one named, anchored band in the landing's padding", () => {
    render(
      <RuledBand id="agents" label="Built for agents">
        <p>Words</p>
      </RuledBand>,
    );
    const band = screen.getByRole("region", { name: "Built for agents" });
    expect(band.id).toBe("agents");
    expect(band.getAttribute("data-slot")).toBe("blueprint-section");
    expect(band.className).toContain("px-4");
  });

  it("draws no second band inside another", () => {
    const { container } = render(
      <RuledBand>
        <RuledBand label="Inner" className="p-0">
          <p>Words</p>
        </RuledBand>
      </RuledBand>,
    );
    expect(container.querySelectorAll('[data-slot="blueprint-section"]')).toHaveLength(1);
    expect(screen.queryByRole("region", { name: "Inner" })).toBeNull();
    expect(screen.getByText("Words")).toBeTruthy();
  });
});
