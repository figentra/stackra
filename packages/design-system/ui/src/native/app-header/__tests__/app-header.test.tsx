/**
 * Stackra file contract:
 * Purpose: proves the native AppHeader draws its parts in order (start slot, title, search, end slot, user menu), draws
 *          a string or number in any slot inside Text (the title semibold and on one line) and any other node as given,
 *          keeps the search slot as the flexible gap, draws no title or end slot when they are left out, puts `label` on
 *          the root as the accessibility label only when given, merges the caller's classes, passes unknown props to the
 *          root `View` and refuses `accessibilityLabel` at the type level.
 * Boundary: React Native does not render in vitest: react-native and the native Text are replaced by recording
 *           stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-166
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { AppHeader } from "#native/app-header/app-header";
import type { AppHeaderProps } from "#native/app-header/app-header.props";

vi.mock("react-native", () => ({
  View: ({
    children,
    className,
    accessibilityLabel,
    testID,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({
    children,
    className,
    numberOfLines,
  }: {
    children?: ReactNode;
    className?: string;
    numberOfLines?: number;
  }) => (
    <span data-testid="text" className={className} data-lines={numberOfLines}>
      {children}
    </span>
  ),
}));

const mark = (name: string) => <i data-testid={name} />;

describe("AppHeader (native)", () => {
  it("draws the parts in order: start slot, title, search, end slot, user menu", () => {
    render(
      <AppHeader
        testID="bar"
        startContent={mark("start")}
        title={mark("title")}
        search={mark("search")}
        endContent={mark("end")}
        userMenu={mark("user")}
      />,
    );
    const ids = [...screen.getByTestId("bar").querySelectorAll("i")].map((node) =>
      node.getAttribute("data-testid"),
    );
    expect(ids).toEqual(["start", "title", "search", "end", "user"]);
  });

  it("draws a string or number in any slot inside Text, never bare in a View", () => {
    render(
      <AppHeader startContent="Menu" title="Acme" search="Find" endContent={3} userMenu="Ada" />,
    );
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual([
      "Menu",
      "Acme",
      "Find",
      "3",
      "Ada",
    ]);
  });

  it("draws the title semibold and on one line", () => {
    render(<AppHeader title="Acme" />);
    const [title] = screen.getAllByTestId("text");
    expect(title?.className).toBe("font-semibold");
    expect(title?.getAttribute("data-lines")).toBe("1");
  });

  it("draws any other node as given, without a Text", () => {
    render(<AppHeader title={mark("logo")} />);
    expect(screen.queryByTestId("text")).toBeNull();
    expect(screen.getByTestId("logo")).toBeTruthy();
  });

  it("keeps the search slot as the flexible gap, with or without a search", () => {
    render(<AppHeader testID="bar" />);
    const gap = screen.getByTestId("bar").querySelector(".flex-1");
    expect(gap).toBeTruthy();
    expect(gap?.childElementCount).toBe(0);
  });

  it("draws no end slot when it is left out", () => {
    render(<AppHeader testID="bar" title={mark("title")} />);
    expect(screen.getByTestId("bar").querySelectorAll(".gap-1")).toHaveLength(0);
  });

  it("puts `label` on the root as the accessibility label only when given", () => {
    const { rerender } = render(<AppHeader testID="bar" />);
    expect(screen.getByTestId("bar").hasAttribute("aria-label")).toBe(false);
    rerender(<AppHeader testID="bar" label="Console top bar" />);
    expect(screen.getByTestId("bar").getAttribute("aria-label")).toBe("Console top bar");
  });

  it("gives the bar the banner role, named or not", () => {
    render(<AppHeader testID="bar" />);
    expect(screen.getByTestId("bar").getAttribute("data-extra")).toContain("role");
  });

  it("merges the caller's classes and passes unknown props to the root", () => {
    render(<AppHeader testID="bar" className="extra" accessibilityHint="Top bar" />);
    expect(screen.getByTestId("bar").className).toContain("extra");
    expect(screen.getByTestId("bar").className).toContain("border-b");
    expect(screen.getByTestId("bar").getAttribute("data-extra")).toContain("accessibilityHint");
  });

  it("refuses the raw `accessibilityLabel` at the type level", () => {
    // @ts-expect-error: `label` is the bar's name, not `accessibilityLabel`
    const refused: AppHeaderProps = { accessibilityLabel: "Top bar" };
    expect(refused).toBeTruthy();
  });
});
