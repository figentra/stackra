/**
 * Stackra file contract:
 * Purpose: proves the native Result announces itself politely through the StateLayout, draws the status tone's icon
 *          in a marker hidden from the reader (a spinner while pending, the given icon when one is given, none when
 *          `icon` is false) and passes the heading level, class and the rest through.
 * Boundary: React Native does not render in vitest, so it, the StateLayout, Spinner and FeedbackIcon are recording
 *           stand-ins that render plain DOM; what the StateLayout is handed is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Result } from "#native/result/result";

const state = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.props["marker"] = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/state-layout/state-layout", async () => {
  const { createElement } = await import("react");
  return {
    StateLayout: (props: Record<string, unknown>) => {
      state.props["layout"] = props;
      return createElement("section", null, props["icon"] as ReactNode);
    },
  };
});
vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return { Spinner: () => createElement("i", { "data-testid": "spinner" }) };
});
vi.mock("#native/feedback-icon/feedback-icon", async () => {
  const { createElement } = await import("react");
  return {
    FeedbackIcon: (props: Record<string, unknown>) => {
      state.props["icon"] = props;
      return createElement("i", { "data-testid": "feedback-icon" });
    },
  };
});

const propsOf = (name: string) => state.props[name] ?? {};

beforeEach(() => {
  state.props = {};
});

describe("Result (native)", () => {
  it.each([
    ["success", "success"],
    ["error", "danger"],
    ["info", "accent"],
  ] as const)("draws the %s tone's icon in a hidden marker", (status, tone) => {
    render(<Result status={status} title="Done" />);
    expect(propsOf("layout")).toMatchObject({
      title: "Done",
      accessibilityLiveRegion: "polite",
      headingLevel: 2,
      defaultIcon: "circle-check",
    });
    expect(propsOf("layout")).not.toHaveProperty("className");
    expect(propsOf("icon")).toEqual({ tone });
    expect(propsOf("marker")["importantForAccessibility"]).toBe("no-hide-descendants");
  });

  it("spins while pending", () => {
    render(<Result status="pending" title="Saving" />);
    expect(screen.getByTestId("spinner")).toBeTruthy();
    expect(screen.queryByTestId("feedback-icon")).toBeNull();
  });

  it("takes the given icon, heading level and class", () => {
    render(<Result status="info" title="Hi" icon="star" headingLevel={3} className="wide" />);
    expect(propsOf("icon")).toEqual({ tone: "accent", icon: "star" });
    expect(propsOf("layout")).toMatchObject({ headingLevel: 3, className: "wide" });
  });

  it("draws no icon when told not to", () => {
    render(<Result status="success" title="Done" icon={false} />);
    expect(propsOf("layout")["icon"]).toBe(false);
    expect(state.props["marker"]).toBeUndefined();
  });
});
