/**
 * Stackra file contract:
 * Purpose: proves the web EmptyState draws the icon of its reason (and none registered by the app), puts the title as
 *          a heading at the level it is given (2 by default), then the description and the actions in that order,
 *          leaves out what was not given, draws another icon, an element or none, passes unknown props and the ref
 *          through, is not a live region, and that the type requires a title and refuses `variant`.
 * Boundary: jsdom with real HeroUI and the real icon registry; the theme CSS is not loaded, so classes and attributes
 *           are read, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-149
import { render, screen } from "@testing-library/react";
import { createRef } from "react";

import { EmptyReason } from "#contracts/enums/empty-reason.enum";
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import { EmptyState } from "#react/empty-state/empty-state";
import type { EmptyStateProps } from "#react/empty-state/empty-state.props";

/** The Lucide icon an element draws, by its kebab-case name. */
const drawsIcon = (container: HTMLElement, name: string) =>
  [...(container.querySelector("svg")?.classList ?? [])].some((className) =>
    className.startsWith(`lucide-${name}`),
  );

describe("EmptyState (web)", () => {
  it.each([
    ["no-data", "inbox"],
    ["no-results", "search-x"],
    ["permission-denied", "lock"],
  ] as const)("draws the %s icon, decorative, and names the reason", (reason, icon) => {
    const { container } = render(<EmptyState reason={reason} title="Nothing here" />);
    expect(drawsIcon(container, icon)).toBe(true);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild?.getAttribute("data-reason")).toBe(reason);
  });

  it("is a no-data state without a reason, and has a reason for each value of the contract", () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    expect(container.firstElementChild?.getAttribute("data-reason")).toBe("no-data");
    expect(EmptyReason).toHaveLength(3);
  });

  it("titles the state with a heading at level 2, or at the level given", () => {
    const { rerender } = render(<EmptyState title="No orders yet" />);
    expect(screen.getByRole("heading", { level: 2, name: "No orders yet" })).toBeTruthy();
    rerender(<EmptyState title="No orders yet" headingLevel={3} />);
    expect(screen.getByRole("heading", { level: 3, name: "No orders yet" })).toBeTruthy();
  });

  it("puts the icon, the title, the description and the actions in that order", () => {
    const { container } = render(
      <EmptyState
        title="No orders yet"
        description="Orders appear here once a customer pays."
        actions={<button type="button">Create an order</button>}
      />,
    );
    const root = container.firstElementChild;
    expect([...(root?.children ?? [])].map((child) => child.tagName)).toEqual([
      "DIV",
      "H2",
      "P",
      "DIV",
    ]);
    expect(root?.children[0]?.getAttribute("data-slot")).toBe("state-icon");
    expect(root?.children[3]?.getAttribute("data-slot")).toBe("state-actions");
    expect(screen.getByRole("button", { name: "Create an order" })).toBeTruthy();
  });

  it("leaves out the description and the actions that were not given", () => {
    const { container } = render(<EmptyState title="No orders yet" />);
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector('[data-slot="state-actions"]')).toBeNull();
  });

  it("draws another icon by name, an element as given, and none for false", () => {
    const { container, rerender } = render(<EmptyState title="Empty" icon="info" />);
    expect(drawsIcon(container, "info")).toBe(true);
    expect(drawsIcon(container, "inbox")).toBe(false);
    rerender(<EmptyState title="Empty" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(container.querySelector("svg")).toBeNull();
    rerender(<EmptyState title="Empty" icon={false} />);
    expect(container.querySelector('[data-slot="state-icon"]')).toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("is not a live region: an empty result is content, not an event", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstElementChild?.hasAttribute("role")).toBe(false);
    expect(container.firstElementChild?.hasAttribute("aria-live")).toBe(false);
  });

  it("passes unknown props and the ref through to the root", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <EmptyState ref={ref} title="Empty" id="e" className="extra" data-testid="empty" lang="ar" />,
    );
    const root = container.firstElementChild;
    expect(root?.id).toBe("e");
    expect(root?.classList.contains("extra")).toBe(true);
    expect(root?.getAttribute("data-testid")).toBe("empty");
    expect(root?.getAttribute("lang")).toBe("ar");
    expect(ref.current).toBe(root);
  });

  it("types: extends the contract, requires a title, refuses `variant`", () => {
    expectTypeOf<EmptyStateProps>().toExtend<EmptyStateContractProps>();
    // @ts-expect-error the title is the heading a screen reader jumps to
    void (<EmptyState />);
    // @ts-expect-error `variant` means emphasis, and an empty state has one look
    void (<EmptyState title="Empty" variant="secondary" />);
    // @ts-expect-error a reason is one of the three of the contract
    void (<EmptyState title="Empty" reason="nothing" />);
  });
});
