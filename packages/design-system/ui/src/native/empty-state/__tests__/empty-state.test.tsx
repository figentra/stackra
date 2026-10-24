/**
 * Stackra file contract:
 * Purpose: proves the native EmptyState hands the icon well the icon of its reason (or the caller's, an element as
 *          given, none for false), titles itself with a heading at the level it is given (2 by default), wraps the
 *          description in `Text`, puts the actions in a wrapping row of their own, leaves out what was not given,
 *          passes unknown props through, is not a live region, and that the type requires a title and refuses
 *          `variant`.
 * Boundary: React Native does not render in vitest, so react-native, the typography, the icon and the registry
 *           provider are replaced by recording stand-ins that render plain DOM; what reaches them is checked, not
 *           their rendering on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 5 and 6); WCAG 2.2 SC 1.3.1; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-150
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { EmptyReason } from "#contracts/enums/empty-reason.enum";
import type { EmptyStateContractProps } from "#contracts/types/empty-state-contract-props.type";
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { EmptyState, type EmptyStateProps } from "#native/empty-state/empty-state";

/** The props each stand-in was last handed, by name, and every View in order. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.views.push(props);
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/heading/heading", async () => {
  const { createElement } = await import("react");
  return {
    Heading: (props: Record<string, unknown>) => {
      received.props["heading"] = props;
      return createElement("h2", { "data-testid": "heading" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      received.props["text"] = props;
      return createElement("p", { "data-testid": "text" }, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) => {
      received.props["icon"] = props;
      return createElement("i", { "data-testid": "icon" });
    },
  };
});

vi.mock("#native/state-layout/state-icons.constant", () => ({ STATE_ICONS: {} }));

const propsOf = (name: string) => received.props[name] ?? {};

describe("EmptyState (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.views = [];
  });

  it.each(EmptyReason)("draws the icon of the %s reason, small and muted", (reason) => {
    render(<EmptyState reason={reason} title="Nothing here" />);
    expect(propsOf("icon")).toEqual({ name: STATE_ICON[reason], size: "lg", tone: "muted" });
  });

  it("is a no-data state without a reason", () => {
    render(<EmptyState title="Nothing here" />);
    expect(propsOf("icon")["name"]).toBe("inbox");
  });

  it("titles the state with a heading at level 2, or the level given, and centres it", () => {
    const { rerender } = render(<EmptyState title="No orders yet" />);
    expect(propsOf("heading")).toMatchObject({
      level: 2,
      align: "center",
      children: "No orders yet",
    });
    rerender(<EmptyState title="No orders yet" headingLevel={3} />);
    expect(propsOf("heading")["level"]).toBe(3);
  });

  it("wraps the description in Text, muted, and puts the actions in a wrapping row", () => {
    render(
      <EmptyState
        title="No orders yet"
        description="Orders appear here once a customer pays."
        actions={<i data-testid="create" />}
      />,
    );
    expect(propsOf("text")).toMatchObject({
      tone: "muted",
      children: "Orders appear here once a customer pays.",
    });
    const row = received.views.find((view) => String(view["className"]).includes("flex-wrap"));
    expect(String(row?.["className"])).toContain("flex-row");
    expect(screen.getByTestId("create")).toBeTruthy();
  });

  it("leaves out the description and the actions that were not given", () => {
    render(<EmptyState title="No orders yet" />);
    expect(screen.queryByTestId("text")).toBeNull();
    expect(received.views.some((view) => String(view["className"]).includes("flex-wrap"))).toBe(
      false,
    );
  });

  it("draws another icon by name, an element as given, and none for false", () => {
    const { rerender } = render(<EmptyState title="Empty" icon="info" />);
    expect(propsOf("icon")["name"]).toBe("info");
    received.props = {};
    rerender(<EmptyState title="Empty" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(propsOf("icon")).toEqual({});
    rerender(<EmptyState title="Empty" icon={false} />);
    expect(screen.queryByTestId("mine")).toBeNull();
    expect(propsOf("icon")).toEqual({});
  });

  it("is not a live region and passes unknown props to the root view", () => {
    render(<EmptyState title="Empty" className="extra" testID="empty" />);
    // The first View rendered is the root: a parent renders before its children.
    const root = received.views[0];
    expect(root).toMatchObject({ testID: "empty" });
    expect(String(root?.["className"])).toContain("extra");
    expect(root).not.toHaveProperty("role");
    expect(root).not.toHaveProperty("aria-live");
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
