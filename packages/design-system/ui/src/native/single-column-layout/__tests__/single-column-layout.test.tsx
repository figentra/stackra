/**
 * Stackra file contract:
 * Purpose: proves the native SingleColumnLayout stacks its children in a `View` with a gap, draws a string or number
 *          child inside Text and any other node as it is, merges a caller's class, and passes every `View` prop
 *          through.
 * Boundary: React Native does not render in vitest: react-native and the native Text are replaced by recording
 *           stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0314 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-171
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { SingleColumnLayout } from "#native/single-column-layout/single-column-layout";

vi.mock("react-native", () => ({
  View: ({
    children,
    className,
    testID,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      className={className as string | undefined}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span data-testid="text">{children}</span>,
}));

describe("SingleColumnLayout (native)", () => {
  it("stacks its children in order in one View with a gap", () => {
    render(
      <SingleColumnLayout testID="layout">
        <i data-testid="one" />
        <i data-testid="two" />
      </SingleColumnLayout>,
    );
    const layout = screen.getByTestId("layout");
    expect(layout.className).toBe("gap-3");
    expect([...layout.children].map((child) => child.getAttribute("data-testid"))).toEqual([
      "one",
      "two",
    ]);
  });

  it("draws a string or number child inside Text and a node as it is", () => {
    const { rerender } = render(<SingleColumnLayout>Hello</SingleColumnLayout>);
    expect(screen.getByTestId("text").textContent).toBe("Hello");
    rerender(<SingleColumnLayout>{7}</SingleColumnLayout>);
    expect(screen.getByTestId("text").textContent).toBe("7");
    rerender(
      <SingleColumnLayout>
        <i data-testid="node" />
      </SingleColumnLayout>,
    );
    expect(screen.queryByTestId("text")).toBeNull();
    expect(screen.getByTestId("node")).toBeTruthy();
  });

  it("merges a caller's class and passes other props to the View", () => {
    render(<SingleColumnLayout testID="layout" className="px-4" accessibilityHint="Page" />);
    const layout = screen.getByTestId("layout");
    expect(layout.className).toBe("gap-3 px-4");
    expect(layout.getAttribute("data-extra")).toBe("accessibilityHint");
  });
});
