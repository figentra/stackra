/**
 * Stackra file contract:
 * Purpose: proves the native NavigationHeader draws back button, start slot, title and end slot in order, draws a string
 *          title as a Heading (compact, one line, or large under the row with `hasLargeTitle`) and any other node as
 *          given, draws a ghost IconButton with a mirrored chevron named from `backLabel` for `onBack` or `backHref` and
 *          none without either, runs `onBack` before opening `backHref` through the nearest RouterProvider (an app path
 *          only, and nothing without a provider), draws a string or number in a slot inside Text, pads the top by the
 *          safe-area inset unless `hasTopInset` is false, puts `label` on the root only when given, merges the caller's
 *          classes and style, passes unknown props to the root, and refuses `accessibilityLabel` at the type level.
 * Boundary: React Native does not render in vitest: react-native, the safe-area context and the native Heading,
 *           IconButton, Icon and Text are replaced by recording stand-ins that render plain DOM, so what reaches them is
 *           checked, not their rendering. The RouterProvider is the real one.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0317 (decisions 1, 4 and 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-175
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { NavigationHeader } from "#native/navigation-header/navigation-header";
import type { NavigationHeaderProps } from "#native/navigation-header/navigation-header.props";
import { RouterProvider } from "#native/router-provider/router-provider";
import { isDirectionalIcon } from "#core/functions/is-directional-icon.function";

// The material layer draws natively (expo-glass-effect, expo-blur); here it is the View it wraps, its role kept.
vi.mock("#native/glass/glass-surface", async () => {
  const { createElement } = await import("react");
  const { View } = (await import("react-native")) as unknown as {
    View: (props: Record<string, unknown>) => unknown;
  };
  return {
    GlassSurface: ({ material, ...props }: Record<string, unknown>) =>
      createElement(View as never, { ...props, "data-material": material }),
  };
});

vi.mock("react-native", () => ({
  View: ({
    children,
    testID,
    className,
    accessibilityLabel,
    style,
    ...rest
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
      data-style={JSON.stringify(style)}
      data-extra={Object.keys(rest).sort().join(",")}
    >
      {children}
    </div>
  ),
}));
vi.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
vi.mock("#native/heading/heading", () => ({
  Heading: ({
    children,
    level,
    type,
    isTruncated,
    className,
  }: {
    children?: ReactNode;
    level: number;
    type: string;
    isTruncated: boolean;
    className?: string;
  }) => (
    <h1
      data-testid="heading"
      data-level={level}
      data-type={type}
      data-truncated={String(isTruncated)}
      className={className}
    >
      {children}
    </h1>
  ),
}));
vi.mock("#native/icon/icon", () => ({
  Icon: ({ name, isMirroredInRtl }: { name: string; isMirroredInRtl?: boolean }) => (
    <i
      data-testid="icon"
      data-name={name}
      data-mirrored={String(isMirroredInRtl ?? isDirectionalIcon(name))}
    />
  ),
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: ({
    icon,
    label,
    variant,
    onPress,
  }: {
    icon: ReactNode;
    label: string;
    variant: string;
    onPress: () => void;
  }) => (
    <button type="button" aria-label={label} data-variant={variant} onClick={onPress}>
      {icon}
    </button>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({ children }: { children?: ReactNode }) => <span data-testid="text">{children}</span>,
}));

const mark = (name: string) => <i data-testid={name} />;
const rootOf = (testID = "bar") => screen.getByTestId(testID);
const style = () => JSON.parse(rootOf().getAttribute("data-style") ?? "[]") as unknown[];

describe("NavigationHeader (native)", () => {
  it("draws back button, start slot, title and end slot in order", () => {
    render(
      <NavigationHeader
        testID="bar"
        title="Orders"
        onBack={() => undefined}
        startContent={mark("start")}
        endContent={mark("end")}
      />,
    );
    const order = [...rootOf().querySelectorAll("button, [data-testid]")]
      .map((node) => node.getAttribute("data-testid") ?? node.getAttribute("aria-label"))
      .filter((id) => ["Back", "start", "heading", "end"].includes(String(id)));
    expect(order).toEqual(["Back", "start", "heading", "end"]);
  });

  it("draws a string title as a compact one-line Heading at the given level", () => {
    render(<NavigationHeader title="Orders" headingLevel={2} />);
    const heading = screen.getByTestId("heading");
    expect(heading.textContent).toBe("Orders");
    expect(heading.getAttribute("data-level")).toBe("2");
    expect(heading.getAttribute("data-type")).toBe("h5");
    expect(heading.getAttribute("data-truncated")).toBe("true");
  });

  it("draws the title large under the row with hasLargeTitle", () => {
    render(<NavigationHeader testID="bar" title="Orders" hasLargeTitle onBack={() => undefined} />);
    const heading = screen.getByTestId("heading");
    expect(heading.getAttribute("data-type")).toBe("h2");
    expect(heading.getAttribute("data-truncated")).toBe("false");
    const row = rootOf().firstElementChild as HTMLElement;
    expect(row.contains(heading)).toBe(false);
    expect(row.nextElementSibling).toBe(heading);
  });

  it("draws a title that is any other node as given, without a Heading", () => {
    render(<NavigationHeader title={mark("logo")} />);
    expect(screen.queryByTestId("heading")).toBeNull();
    expect(screen.getByTestId("logo")).toBeTruthy();
  });

  it("draws a string or number in a slot inside Text", () => {
    render(<NavigationHeader title="Orders" startContent="Menu" endContent={3} />);
    expect(screen.getAllByTestId("text").map((node) => node.textContent)).toEqual(["Menu", "3"]);
  });

  it("draws a ghost back button with a mirrored chevron, named from backLabel", () => {
    render(<NavigationHeader title="Orders" onBack={() => undefined} backLabel="Retour" />);
    const button = screen.getByRole("button", { name: "Retour" });
    expect(button.getAttribute("data-variant")).toBe("ghost");
    const icon = button.querySelector("[data-testid='icon']");
    expect(icon?.getAttribute("data-name")).toBe("chevron-left");
    expect(icon?.getAttribute("data-mirrored")).toBe("true");
  });

  it("names the back button 'Back' by default and draws none without onBack or backHref", () => {
    const { rerender } = render(<NavigationHeader title="Orders" />);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<NavigationHeader title="Orders" onBack={() => undefined} />);
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
  });

  it("runs onBack, then opens backHref through the RouterProvider", () => {
    const calls: string[] = [];
    render(
      <RouterProvider navigate={(href) => calls.push(`go ${href}`)}>
        <NavigationHeader title="Orders" backHref="/home" onBack={() => calls.push("back")} />
      </RouterProvider>,
    );
    act(() => screen.getByRole("button", { name: "Back" }).click());
    expect(calls).toEqual(["back", "go /home"]);
  });

  it("does not follow a URL with a scheme, and does nothing for backHref without a provider", () => {
    const navigate = vi.fn();
    const { rerender } = render(
      <RouterProvider navigate={navigate}>
        <NavigationHeader title="Orders" backHref="https://example.com" />
      </RouterProvider>,
    );
    act(() => screen.getByRole("button", { name: "Back" }).click());
    expect(navigate).not.toHaveBeenCalled();
    rerender(<NavigationHeader title="Orders" backHref="/home" />);
    expect(() => act(() => screen.getByRole("button", { name: "Back" }).click())).not.toThrow();
  });

  it("pads the top by the safe-area inset unless hasTopInset is false", () => {
    const { rerender } = render(<NavigationHeader testID="bar" title="Orders" />);
    expect(style()).toContainEqual({ paddingTop: 44 });
    rerender(<NavigationHeader testID="bar" title="Orders" hasTopInset={false} />);
    expect(style()).not.toContainEqual({ paddingTop: 44 });
  });

  it("puts `label` on the root as the accessibility label only when given", () => {
    const { rerender } = render(<NavigationHeader testID="bar" title="Orders" />);
    expect(rootOf().hasAttribute("aria-label")).toBe(false);
    rerender(<NavigationHeader testID="bar" title="Orders" label="Orders bar" />);
    expect(rootOf().getAttribute("aria-label")).toBe("Orders bar");
  });

  it("merges the caller's classes and style and passes unknown props to the root", () => {
    render(
      <NavigationHeader
        testID="bar"
        title="Orders"
        className="extra"
        style={{ opacity: 0.5 }}
        accessibilityHint="Top bar"
      />,
    );
    expect(rootOf().className).toContain("extra");
    expect(rootOf().className).toContain("border-b");
    expect(rootOf().getAttribute("data-style")).toContain("0.5");
    expect(rootOf().getAttribute("data-extra")).toContain("accessibilityHint");
  });

  it("refuses the raw `accessibilityLabel` at the type level", () => {
    // @ts-expect-error: `label` is the header's name, not `accessibilityLabel`
    const refused: NavigationHeaderProps = { title: "Orders", accessibilityLabel: "Bar" };
    expect(refused).toBeTruthy();
  });
});
