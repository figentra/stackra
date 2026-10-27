/**
 * Stackra file contract:
 * Purpose: proves the native ErrorState hands its root view the assertive alert live region and the caller cannot
 *          change it, titles itself with a level-1 heading by default, draws the icon of its kind, wraps the message
 *          and, outside production only, the stack in `Text`, offers a retry button that runs what it was given with
 *          further actions after it, passes unknown props through, and that the type requires a title and refuses
 *          `role` and `variant`.
 * Boundary: React Native does not render in vitest, so react-native, the typography, the icon and the button are
 *           replaced by recording stand-ins that render plain DOM; what reaches them is checked, not their rendering
 *           on a device. `NODE_ENV` is stubbed for the production case.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 6); ADR 0140; WCAG 2.2 SC 1.3.1 and 4.1.3;
 *          ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-150
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { ErrorStateKind } from "#contracts/enums/error-state-kind.enum";
import type { ErrorStateContractProps } from "#contracts/types/error-state-contract-props.type";
import { STATE_ICON } from "#core/constants/state-icon.constant";
import { ErrorState } from "#native/error-state/error-state";
import type { ErrorStateProps } from "#native/error-state/error-state.props";

/** The props each stand-in was last handed, by name, every View and every Text in order. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
  texts: [] as Record<string, unknown>[],
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
      return createElement("h1", null, props["children"] as ReactNode);
    },
  };
});

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      received.texts.push(props);
      return createElement("p", null, props["children"] as ReactNode);
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

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      received.props["button"] = props;
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});

vi.mock("#native/state-layout/state-icons.constant", () => ({ STATE_ICONS: {} }));

const propsOf = (name: string) => received.props[name] ?? {};

describe("ErrorState (native)", () => {
  beforeEach(() => {
    received.props = {};
    received.views = [];
    received.texts = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is an assertive alert on the root view", () => {
    render(<ErrorState title="Something went wrong" />);
    // The first View rendered is the root: a parent renders before its children.
    expect(received.views[0]).toMatchObject({ role: "alert", "aria-live": "assertive" });
  });

  it("titles the screen with a level-1 heading, or the level given", () => {
    const { rerender } = render(<ErrorState title="Something went wrong" />);
    expect(propsOf("heading")).toMatchObject({ level: 1, children: "Something went wrong" });
    rerender(<ErrorState title="Something went wrong" headingLevel={2} />);
    expect(propsOf("heading")["level"]).toBe(2);
  });

  it.each(ErrorStateKind)("draws the icon of the %s kind", (kind) => {
    render(<ErrorState kind={kind} title="Failed" />);
    expect(propsOf("icon")["name"]).toBe(STATE_ICON[kind]);
  });

  it("is an unexpected failure without a kind", () => {
    render(<ErrorState title="Failed" />);
    expect(propsOf("icon")["name"]).toBe("triangle-alert");
  });

  it("wraps the message and, outside production, the stack in Text", () => {
    const error = new Error("Order service is down");
    render(<ErrorState title="Failed" error={error} />);
    expect(received.texts.map((text) => text["children"])).toEqual([
      "Order service is down",
      error.stack,
    ]);
  });

  it("hides the message in production, where it may be an internal", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<ErrorState title="Failed" error={new Error("db: pool exhausted")} />);
    expect(received.texts).toEqual([]);
  });

  it("shows the message in production when the app marks it as safe, never the stack", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<ErrorState title="Failed" error={new Error("Order is not payable")} isMessageShown />);
    expect(received.texts.map((text) => text["children"])).toEqual(["Order is not payable"]);
  });

  it("hides the message outside production when the app says so", () => {
    render(<ErrorState title="Failed" error={new Error("x")} isMessageShown={false} />);
    expect(received.texts).toEqual([]);
  });

  it("shows no details for a value with no message", () => {
    render(<ErrorState title="Failed" error={{ code: 500 }} />);
    expect(received.texts).toEqual([]);
  });

  it("offers a retry that runs what it was given, with further actions after it", () => {
    const onPress = vi.fn();
    render(
      <ErrorState
        title="Failed"
        retry={{ label: "Try again", onPress }}
        actions={<i data-testid="support" />}
      />,
    );
    const button = screen.getByRole("button", { name: "Try again" });
    expect(button.nextElementSibling?.getAttribute("data-testid")).toBe("support");
    button.click();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("has no actions row without a retry or actions", () => {
    render(<ErrorState title="Failed" />);
    expect(received.views.some((view) => String(view["className"]).includes("flex-wrap"))).toBe(
      false,
    );
  });

  it("draws another icon, an element as given, and none for false", () => {
    const { rerender } = render(<ErrorState title="Failed" icon="info" />);
    expect(propsOf("icon")["name"]).toBe("info");
    received.props = {};
    rerender(<ErrorState title="Failed" icon={<i data-testid="mine" />} />);
    expect(screen.getByTestId("mine")).toBeTruthy();
    expect(propsOf("icon")).toEqual({});
    rerender(<ErrorState title="Failed" icon={false} />);
    expect(screen.queryByTestId("mine")).toBeNull();
  });

  it("passes unknown props through to the root view", () => {
    render(<ErrorState title="Failed" className="extra" testID="error" />);
    expect(received.views[0]).toMatchObject({ testID: "error" });
    expect(String(received.views[0]?.["className"])).toContain("extra");
  });

  it("types: extends the contract, requires a title, refuses `role` and `variant`", () => {
    expectTypeOf<ErrorStateProps>().toExtend<ErrorStateContractProps>();
    // @ts-expect-error the title is the heading a screen reader jumps to
    void (<ErrorState />);
    // @ts-expect-error the screen is a live region of its own, never the caller's
    void (<ErrorState title="Failed" role="status" />);
    // @ts-expect-error `variant` means emphasis, and an error state has one look
    void (<ErrorState title="Failed" variant="secondary" />);
    // @ts-expect-error a retry needs its label
    void (<ErrorState title="Failed" retry={{ onPress: () => undefined }} />);
  });
});
