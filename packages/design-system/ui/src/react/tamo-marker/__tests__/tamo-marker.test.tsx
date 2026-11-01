/**
 * Stackra file contract:
 * Purpose: proves the web TamoMarker says "Made with Tamo", or the review words for a field awaiting a check.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { TamoMarker } from "#react/tamo-marker/tamo-marker";

describe("TamoMarker (web)", () => {
  it("names what Tamo made, and what awaits a check", () => {
    const { rerender } = render(<TamoMarker />);
    expect(screen.getByText("Made with Tamo")).toBeTruthy();
    rerender(<TamoMarker needsReview />);
    expect(screen.getByText("Filled by Tamo, check it")).toBeTruthy();
  });
});
