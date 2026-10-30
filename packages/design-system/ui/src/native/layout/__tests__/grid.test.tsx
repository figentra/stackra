/**
 * Stackra file contract:
 * Purpose: proves the native Grid's column count: two by default, one before the first layout with `minItemWidth`
 *          and then as many as fit the measured width, never below one; it forwards its own `onLayout` and keeps the
 *          caller's class after its gap.
 * Boundary: React Native's View is a stand-in that renders plain DOM and exposes `onLayout` for the test to call.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Grid } from "#native/layout/grid";

const state = vi.hoisted(() => ({ layouts: {} as Record<string, (event: unknown) => void> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      const id = props["testID"] as string | undefined;
      if (id) state.layouts[id] = props["onLayout"] as (event: unknown) => void;
      return createElement(
        "div",
        { "data-testid": id, className: props["className"] },
        props["children"] as ReactNode,
      );
    },
  };
});

/** The column count of each row of the grid `id`. */
const columns = (id: string): number[] =>
  [...screen.getByTestId(id).children].map((row) => row.children.length);

/** Lays the grid `id` out at `width` points. */
const layout = (id: string, width: number): void =>
  act(() => state.layouts[id]?.({ nativeEvent: { layout: { width } } }));

const cells = ["a", "b", "c", "d"].map((cell) => <i key={cell}>{cell}</i>);

describe("Grid (native)", () => {
  it("lays cells in two columns by default and keeps the caller's class", () => {
    render(
      <Grid testID="grid" className="p-4">
        {cells}
      </Grid>,
    );
    expect(columns("grid")).toEqual([2, 2]);
    expect(screen.getByTestId("grid").className).toMatch(/^flex-col gap-\S+ p-4$/u);
  });

  it("fits as many columns as the measured width allows", () => {
    const onLayout = vi.fn();
    render(
      <Grid testID="fit" minItemWidth={100} onLayout={onLayout}>
        {cells}
      </Grid>,
    );
    expect(columns("fit")).toEqual([1, 1, 1, 1]);
    layout("fit", 320);
    expect(columns("fit")).toEqual([3, 3]);
    expect(screen.getByTestId("fit").children[1]?.textContent).toBe("d");
    expect(onLayout).toHaveBeenCalledTimes(1);
    layout("fit", 40);
    expect(columns("fit")).toEqual([1, 1, 1, 1]);
  });

  it("never drops below one column", () => {
    render(
      <Grid testID="zero" columns={0}>
        {cells}
      </Grid>,
    );
    expect(columns("zero")).toEqual([1, 1, 1, 1]);
  });
});
