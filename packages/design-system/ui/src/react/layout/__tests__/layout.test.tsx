/**
 * Stackra file contract:
 * Purpose: proves the web layout primitives map their gap to the spacing scale and their alignment to classes, that
 *          Grid takes a fixed column count or fills columns at a minimum width, that Center caps its width, and that
 *          each passes `div` props through.
 * Boundary: jsdom; classes and styles are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { Center } from "#react/layout/center";
import { Cluster } from "#react/layout/cluster";
import { Grid } from "#react/layout/grid";
import { Stack } from "#react/layout/stack";

describe("layout primitives (web)", () => {
  it("stacks with the default gap and a chosen alignment", () => {
    render(
      <Stack data-testid="stack" align="center" aria-label="Blocks">
        <i />
      </Stack>,
    );
    const stack = screen.getByTestId("stack");
    expect(stack.className).toContain("flex-col");
    expect(stack.className).toContain("gap-4");
    expect(stack.className).toContain("items-center");
    expect(stack.getAttribute("aria-label")).toBe("Blocks");
  });

  it("wraps a cluster with its gap and justification", () => {
    render(<Cluster data-testid="cluster" gap="xs" justify="between" />);
    const cluster = screen.getByTestId("cluster");
    expect(cluster.className).toContain("flex-wrap");
    expect(cluster.className).toContain("gap-1");
    expect(cluster.className).toContain("justify-between");
  });

  it("lays a grid in fixed columns, or as many as fit the minimum width", () => {
    const { rerender } = render(<Grid data-testid="grid" columns={3} />);
    expect(screen.getByTestId("grid").style.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");
    rerender(<Grid data-testid="grid" minItemWidth={200} gap="lg" />);
    const grid = screen.getByTestId("grid");
    expect(grid.style.gridTemplateColumns).toContain("auto-fill");
    expect(grid.style.gridTemplateColumns).toContain("200px");
    expect(grid.className).toContain("gap-6");
  });

  it("centres a capped column", () => {
    render(<Center data-testid="center" maxWidth="sm" isTextCentered />);
    const center = screen.getByTestId("center");
    expect(center.className).toContain("mx-auto");
    expect(center.className).toContain("max-w-sm");
    expect(center.className).toContain("text-center");
  });
});
