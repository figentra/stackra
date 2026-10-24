/**
 * Stackra file contract:
 * Purpose: proves the native ToastItem hands HeroUI Native's toast the tone as `variant` and the tone's live-region
 *          attributes, draws the tone's icon unless another or none is given, shows the message and the description
 *          as text parts, names the dismiss button by `dismissLabel`, and runs the action once and then hides the toast.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the feedback icon are replaced
 *           by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decision 3); WCAG 2.2 SC 2.5.8 and 4.1.3; ADR 0022 (test
 *          placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-112 sta-350:FR-114
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Tone } from "#contracts/enums/tone.enum";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { ToastItem, type ToastItemProps } from "#native/toast/toast-item";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Toast: Object.assign(record("toast"), {
      Title: record("title"),
      Description: record("description"),
      Action: record("action"),
      Close: record("close"),
    }),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement("div", { "data-testid": "view" }, props["children"] as ReactNode),
  };
});

vi.mock("#native/feedback-icon/feedback-icon", async () => {
  const { createElement } = await import("react");
  return {
    FeedbackIcon: (props: Record<string, unknown>) => {
      received.props["icon"] = props;
      return createElement("i", { "data-testid": "feedback-icon" });
    },
  };
});

const propsOf = (name: string) => received.props[name] ?? {};

/** What HeroUI Native hands a toast component, with `hide` recorded. */
const hide = vi.fn();
const toastProps = {
  id: "t1",
  index: 0,
  hide,
  show: vi.fn(),
} as unknown as ToastItemProps["toast"];

/** The item's props with the ones a test does not care about filled in. */
const item = (overrides: Partial<ToastItemProps> = {}) => (
  <ToastItem
    toast={toastProps}
    tone="default"
    title="Saved"
    dismissLabel="Dismiss"
    {...overrides}
  />
);

describe("ToastItem (native)", () => {
  beforeEach(() => {
    received.props = {};
    hide.mockClear();
  });

  it.each(Tone)("hands HeroUI Native the %s tone as variant and its live region", (tone) => {
    render(item({ tone }));
    const { role } = FEEDBACK_BY_TONE[tone];
    expect(propsOf("toast")).toMatchObject({
      id: "t1",
      variant: tone,
      role,
      "aria-live": role === "alert" ? "assertive" : "polite",
    });
  });

  it("shows the message and the description as text parts", () => {
    render(item({ title: "Order saved", description: "It ships on Monday." }));
    expect(propsOf("title")["children"]).toBe("Order saved");
    expect(propsOf("description")["children"]).toBe("It ships on Monday.");
  });

  it("leaves out a description that was not given", () => {
    const { container } = render(item());
    expect(container.querySelector('[data-testid="description"]')).toBeNull();
  });

  it("draws the tone's icon, a caller's icon in its place, and none for false", () => {
    const { container, rerender } = render(item({ tone: "danger" }));
    expect(propsOf("icon")).toEqual({ tone: "danger", icon: undefined });
    rerender(item({ tone: "danger", icon: "info" }));
    expect(propsOf("icon")).toEqual({ tone: "danger", icon: "info" });
    rerender(item({ icon: false }));
    expect(container.querySelector('[data-testid="feedback-icon"]')).toBeNull();
  });

  it("names the dismiss button by dismissLabel", () => {
    render(item({ dismissLabel: "إغلاق الإشعار" }));
    expect(propsOf("close")["aria-label"]).toBe("إغلاق الإشعار");
  });

  it("runs the action once and then hides the toast", () => {
    const onPress = vi.fn();
    render(item({ action: { label: "Undo", onPress } }));
    expect(propsOf("action")["children"]).toBe("Undo");
    act(() => (propsOf("action")["onPress"] as () => void)());
    expect(onPress).toHaveBeenCalledOnce();
    expect(hide).toHaveBeenCalledOnce();
    expect(hide).toHaveBeenCalledWith("t1");
  });

  it("has no action button when there is no action", () => {
    const { container } = render(item());
    expect(container.querySelector('[data-testid="action"]')).toBeNull();
  });
});
