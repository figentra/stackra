/**
 * Stackra file contract:
 * Purpose: proves the demo icon draws its named path as a decorative svg, hidden from assistive technology.
 * Boundary: jsdom; no network.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0022 (test placement).
 */
// @covers sta-403:FR-013
import { render } from "@testing-library/react";

import { DemoIcon } from "#src/components/demo-icon";

describe("DemoIcon", () => {
  it("draws the named icon, hidden from assistive technology", () => {
    const { container } = render(<DemoIcon name="home" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("data-icon")).toBe("home");
    expect(svg?.querySelector("path")?.getAttribute("d")).toMatch(/^M2 7\.5/);
  });
});
