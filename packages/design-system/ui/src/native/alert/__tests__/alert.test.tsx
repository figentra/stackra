/**
 * Stackra file contract:
 * Purpose: proves the native Alert hands HeroUI Native the tone as `status` and the tone's live-region attributes
 *          (an alert and assertive for warning and danger, a status and polite for the rest), draws the tone's icon
 *          unless another or none is given, lays out the title, description and actions in order, passes unknown
 *          props through, and that the type requires a title and refuses `status` and `role`.
 * Boundary: React Native does not render in vitest, so heroui-native, react-native and the feedback icon are replaced
 *           by recording stand-ins that render plain DOM; what reaches HeroUI Native is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (decisions 1 and 3); WCAG 2.2 SC 1.4.1 and 4.1.3; ADR 0022
 *          (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-112 sta-350:FR-114
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Tone } from "#contracts/enums/tone.enum";
import type { AlertContractProps } from "#contracts/types/alert-contract-props.type";
import { FEEDBACK_BY_TONE } from "#core/constants/feedback-by-tone.constant";
import { Alert } from "#native/alert/alert";
import type { AlertProps } from "#native/alert/alert.props";

/** The props each stand-in was last handed, by name, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, Record<string, unknown>> }));

vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  const record = (name: string) => (props: Record<string, unknown>) => {
    received.props[name] = props;
    return createElement("div", { "data-testid": name }, props["children"] as ReactNode);
  };
  return {
    Alert: Object.assign(record("alert"), {
      Indicator: record("indicator"),
      Content: record("content"),
      Title: record("title"),
      Description: record("description"),
    }),
  };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      received.props["view"] = props;
      return createElement("div", { "data-testid": "view" }, props["children"] as ReactNode);
    },
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

describe("Alert (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it.each(Tone)("hands HeroUI Native the %s tone as status and its live region", (tone) => {
    render(<Alert tone={tone} title="Heads up" />);
    const { role } = FEEDBACK_BY_TONE[tone];
    expect(propsOf("alert")).toMatchObject({
      status: tone,
      role,
      "aria-live": role === "alert" ? "assertive" : "polite",
    });
  });

  it("is a default alert without a tone", () => {
    render(<Alert title="Heads up" />);
    expect(propsOf("alert")).toMatchObject({ status: "default", role: "status" });
  });

  it("draws the tone's icon in the indicator, a caller's icon in its place, and none for false", () => {
    const { container, rerender } = render(<Alert tone="danger" title="Failed" />);
    expect(propsOf("icon")).toEqual({ tone: "danger", icon: undefined });
    expect(
      container.querySelector('[data-testid="indicator"] [data-testid="feedback-icon"]'),
    ).toBeTruthy();
    rerender(<Alert tone="danger" title="Failed" icon="info" />);
    expect(propsOf("icon")).toEqual({ tone: "danger", icon: "info" });
    received.props = {};
    rerender(<Alert title="Failed" icon={false} />);
    expect(container.querySelector('[data-testid="indicator"]')).toBeNull();
    expect(propsOf("icon")).toEqual({});
  });

  it("puts the title, the description and the actions in that order, as text parts", () => {
    const { container } = render(
      <Alert
        tone="warning"
        title="Storage is almost full"
        description="Delete files or upgrade."
        actions={<i data-testid="upgrade" />}
      />,
    );
    const content = container.querySelector('[data-testid="content"]');
    expect(
      [...(content?.children ?? [])].map((child) => child.getAttribute("data-testid")),
    ).toEqual(["title", "description", "view"]);
    expect(propsOf("title")["children"]).toBe("Storage is almost full");
    expect(propsOf("description")["children"]).toBe("Delete files or upgrade.");
    expect(content?.querySelector('[data-testid="view"] [data-testid="upgrade"]')).toBeTruthy();
    expect(propsOf("view")["className"]).toContain("flex-row");
  });

  it("leaves out the description and the actions that were not given", () => {
    const { container } = render(<Alert title="Saved" />);
    expect(container.querySelector('[data-testid="description"]')).toBeNull();
    expect(container.querySelector('[data-testid="view"]')).toBeNull();
  });

  it("passes unknown props through to HeroUI Native", () => {
    render(<Alert title="Saved" className="extra" testID="alert" accessibilityLabel="Notice" />);
    expect(propsOf("alert")).toMatchObject({
      className: "extra",
      testID: "alert",
      accessibilityLabel: "Notice",
    });
  });

  it("types: extends the contract, requires a title, refuses `status` and `role`", () => {
    expectTypeOf<AlertProps>().toExtend<AlertContractProps>();
    // @ts-expect-error the title is what a screen reader reads first
    void (<Alert />);
    // @ts-expect-error HeroUI Native's name for the tone is replaced by `tone`
    void (<Alert title="Saved" status="success" />);
    // @ts-expect-error the tone sets the role, never the caller
    void (<Alert title="Saved" role="alert" />);
  });
});
