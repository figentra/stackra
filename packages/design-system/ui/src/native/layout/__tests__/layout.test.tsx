/**
 * Stackra file contract:
 * Purpose: proves the native layout primitives hand `View` the spacing-scale gap and alignment classes, that Grid cuts
 *          its cells into rows of the column count and pads the last row, and that Center caps its width.
 * Boundary: React Native does not render in vitest: react-native's View is replaced by a stand-in
 *           that renders plain DOM, so the classes reaching View are checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Center } from "#native/layout/center";
import { Cluster } from "#native/layout/cluster";
import { Grid } from "#native/layout/grid";
import { Stack } from "#native/layout/stack";

vi.mock("react-native", () => ({
  View: ({
    children,
    className,
    testID,
  }: {
    children?: ReactNode;
    className?: string;
    testID?: string;
  }) => (
    <div data-testid={testID} className={className}>
      {children}
    </div>
  ),
}));

describe("layout primitives (native)", () => {
  it("stacks and clusters with spacing-scale gaps", () => {
    render(
      <>
        <Stack testID="stack" gap="sm" align="end" />
        <Cluster testID="cluster" />
      </>,
    );
    expect(screen.getByTestId("stack").className).toBe("flex-col gap-2 items-end");
    expect(screen.getByTestId("cluster").className).toContain("flex-row flex-wrap gap-2");
  });

  it("cuts a grid into rows of the column count and pads the last row", () => {
    render(
      <Grid testID="grid" columns={2}>
        <i>a</i>
        <i>b</i>
        <i>c</i>
      </Grid>,
    );
    const rows = [...screen.getByTestId("grid").children];
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.children.length)).toEqual([2, 2]);
    expect(rows[1]?.textContent).toBe("c");
  });

  it("centres a capped column", () => {
    render(<Center testID="center" maxWidth="md" />);
    expect(screen.getByTestId("center").className).toContain("self-center px-4 max-w-lg");
  });
});
