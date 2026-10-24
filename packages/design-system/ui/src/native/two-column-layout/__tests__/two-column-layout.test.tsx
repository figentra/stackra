/**
 * Stackra file contract:
 * Purpose: proves the native TwoColumnLayout stacks the main column's blocks before the side column's in one `View`
 *          with a gap, accepts `collapseBelow` and does not pass it on, draws a string or number in either column inside
 *          Text, merges a caller's class, passes every `View` prop through, and that the type requires `aside`.
 * Boundary: React Native does not render in vitest: react-native and the native Text are replaced by recording
 *           stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0314 (decisions 6 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-172
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  TwoColumnLayout,
  type TwoColumnLayoutProps,
} from "#native/two-column-layout/two-column-layout";

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

describe("TwoColumnLayout (native)", () => {
  it("stacks the main column's blocks before the side column's in one View with a gap", () => {
    render(
      <TwoColumnLayout testID="layout" aside={<i data-testid="side" />}>
        <i data-testid="main" />
      </TwoColumnLayout>,
    );
    const layout = screen.getByTestId("layout");
    expect(layout.className).toBe("gap-3");
    expect([...layout.children].map((child) => child.getAttribute("data-testid"))).toEqual([
      "main",
      "side",
    ]);
  });

  it("accepts collapseBelow and does not pass it on, since native has no width to switch on", () => {
    render(<TwoColumnLayout testID="layout" aside={<i />} collapseBelow="xl" />);
    expect(screen.getByTestId("layout").getAttribute("data-extra")).toBe("");
  });

  it("draws a string or number in either column inside Text", () => {
    render(<TwoColumnLayout aside={7}>Main</TwoColumnLayout>);
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual(["Main", "7"]);
  });

  it("merges a caller's class and passes other props to the View", () => {
    render(
      <TwoColumnLayout testID="layout" aside={<i />} className="px-4" accessibilityHint="Page" />,
    );
    const layout = screen.getByTestId("layout");
    expect(layout.className).toBe("gap-3 px-4");
    expect(layout.getAttribute("data-extra")).toBe("accessibilityHint");
  });

  it("requires a side column at the type level", () => {
    // @ts-expect-error: the side column is required
    const lonely: TwoColumnLayoutProps = {};
    expect(lonely).toEqual({});
  });
});
