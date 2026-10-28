/**
 * Stackra file contract:
 * Purpose: proves the native Breadcrumbs names its View, draws every step but the last that has somewhere to go as a
 *          Link with its href and handler, draws the last step and any step with nowhere to go as text, draws one
 *          mirrored muted chevron fewer than steps, and passes unknown props through.
 * Boundary: React Native does not render in vitest: react-native and the native Link, Icon and Text are replaced by
 *          recording stand-ins that render plain DOM, so what reaches them is checked, not their rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-145
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { BreadcrumbItem } from "#contracts/types/breadcrumb-item.type";
import { Breadcrumbs } from "#native/breadcrumbs/breadcrumbs";

vi.mock("react-native", () => ({
  View: ({
    children,
    accessibilityLabel,
    className,
    testID,
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <div
      data-testid={String(testID ?? "view")}
      aria-label={accessibilityLabel as string | undefined}
      className={className as string | undefined}
    >
      {children}
    </div>
  ),
}));
vi.mock("#native/icon/icon", () => ({
  Icon: (props: Record<string, unknown>) => (
    <i
      data-testid="chevron"
      data-name={String(props["name"])}
      data-tone={String(props["tone"])}
      data-mirrored={String(props["isMirroredInRtl"] === true)}
    />
  ),
}));
vi.mock("#native/link/link", () => ({
  Link: ({ children, href, onPress }: Record<string, unknown> & { children?: ReactNode }) => (
    // oxlint-disable-next-line jsx-a11y/anchor-is-valid, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- reason: a test stand-in for the native Link; it only records the press
    <a
      data-testid="link"
      data-href={href as string | undefined}
      onClick={() => (onPress as (() => void) | undefined)?.()}
    >
      {children}
    </a>
  ),
}));
vi.mock("#native/text/text", () => ({
  Text: ({
    children,
    tone,
    accessibilityState,
    accessibilityLabel,
  }: Record<string, unknown> & { children?: ReactNode }) => (
    <span
      data-testid="text"
      data-tone={String(tone)}
      data-selected={String((accessibilityState as { selected?: boolean } | undefined)?.selected)}
      aria-label={accessibilityLabel as string | undefined}
    >
      {children}
    </span>
  ),
}));

const TRAIL: readonly BreadcrumbItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "orders", label: "Orders", href: "/orders" },
  { id: "order", label: "Order 1042" },
];

describe("Breadcrumbs (native)", () => {
  it("names its view by a default label, or the caller's", () => {
    const { rerender } = render(<Breadcrumbs items={TRAIL} />);
    expect(screen.getByLabelText("Breadcrumbs")).toBeTruthy();
    rerender(<Breadcrumbs items={TRAIL} label="Trail" />);
    expect(screen.getByLabelText("Trail")).toBeTruthy();
  });

  it("draws every step but the last as a link with its href, and the last as text", () => {
    render(<Breadcrumbs items={TRAIL} />);
    const links = screen.getAllByTestId("link");
    expect(links.map((link) => [link.textContent, link.dataset["href"]])).toEqual([
      ["Home", "/"],
      ["Orders", "/orders"],
    ]);
    const text = screen.getByTestId("text");
    expect(text.textContent).toBe("Order 1042");
    expect(text.dataset["tone"]).toBe("default");
  });

  it("marks the last step selected and speaks it with the trail's name", () => {
    render(<Breadcrumbs items={TRAIL} label="Trail" />);
    const text = screen.getByTestId("text");
    expect(text.dataset["selected"]).toBe("true");
    expect(text.getAttribute("aria-label")).toBe("Trail: Order 1042");
  });

  it("leaves a step that is not the current page unmarked", () => {
    render(
      <Breadcrumbs
        items={[
          { id: "a", label: "Group" },
          { id: "b", label: "Here" },
        ]}
      />,
    );
    const [group] = screen.getAllByTestId("text");
    expect(group?.dataset["selected"]).toBe("undefined");
  });

  it("draws the last step as text even when it has an href", () => {
    render(<Breadcrumbs items={[{ id: "a", label: "A", href: "/a" }]} />);
    expect(screen.queryByTestId("link")).toBeNull();
    expect(screen.getByTestId("text").textContent).toBe("A");
  });

  it("draws a step with nowhere to go as muted text", () => {
    render(
      <Breadcrumbs
        items={[
          { id: "a", label: "Group" },
          { id: "b", label: "Here" },
        ]}
      />,
    );
    const [group, here] = screen.getAllByTestId("text");
    expect(group?.dataset["tone"]).toBe("muted");
    expect(here?.dataset["tone"]).toBe("default");
  });

  it("runs a step's handler on press", () => {
    const onPress = vi.fn();
    render(
      <Breadcrumbs
        items={[
          { id: "a", label: "Back", onPress },
          { id: "b", label: "Here" },
        ]}
      />,
    );
    fireEvent.click(screen.getByTestId("link"));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("draws one mirrored muted chevron fewer than steps", () => {
    render(<Breadcrumbs items={TRAIL} />);
    const chevrons = screen.getAllByTestId("chevron");
    expect(chevrons).toHaveLength(2);
    for (const chevron of chevrons) {
      expect(chevron.dataset["name"]).toBe("chevron-right");
      expect(chevron.dataset["tone"]).toBe("muted");
      expect(chevron.dataset["mirrored"]).toBe("true");
    }
  });

  it("passes unknown props to the view", () => {
    render(<Breadcrumbs items={TRAIL} testID="trail" className="mb-2" />);
    expect(screen.getByTestId("trail").className).toContain("mb-2");
  });
});
