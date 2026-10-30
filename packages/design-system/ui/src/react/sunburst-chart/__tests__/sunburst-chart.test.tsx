/**
 * Stackra file contract:
 * Purpose: proves the web SunburstChart's pointing: a pointed arc writes its path and value above the chart and fades
 *          the arcs off its path (ancestors and descendants stay), leaving the chart clears it, and without a centre
 *          label no total is written in the middle.
 * Boundary: jsdom; pointer events are fired on the SVG paths, and the fade is the `opacity` attribute.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { SunburstChart } from "#react/sunburst-chart/sunburst-chart";

const ITEMS = [
  {
    key: "d",
    label: "Drinks",
    children: [
      { key: "c", label: "Coffee", value: 30 },
      { key: "t", label: "Tea", value: 10 },
    ],
  },
  { key: "f", label: "Food", value: 20, color: "warning" as const },
];

describe("SunburstChart pointing (web)", () => {
  it("writes the pointed path, fades the arcs off it, and clears when the pointer leaves", () => {
    const { container } = render(
      <SunburstChart label="Revenue" items={ITEMS} palette="categorical" />,
    );
    const svg = screen.getByRole("img", { name: "Revenue" });
    const paths = [...svg.querySelectorAll("path")];
    expect(paths).toHaveLength(4);
    expect(svg.querySelector("text")).toBeNull();
    fireEvent.pointerEnter(paths[1] as Element);
    const readout = container.querySelector("p[aria-hidden]");
    expect(readout?.textContent).toBe("Drinks › Coffee 30");
    expect(paths.map((path) => path.getAttribute("opacity"))).toEqual(["1", "1", "0.45", "0.45"]);
    fireEvent.pointerEnter(paths[0] as Element);
    expect(paths.map((path) => path.getAttribute("opacity"))).toEqual(["1", "1", "1", "0.45"]);
    fireEvent.pointerLeave(svg);
    expect(readout?.textContent).toBe("");
    expect(paths.every((path) => path.getAttribute("opacity") === "1")).toBe(true);
  });
});
