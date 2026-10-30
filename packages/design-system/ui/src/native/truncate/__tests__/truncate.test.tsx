/**
 * Stackra file contract:
 * Purpose: proves the native Truncate: it clamps the text to `lines`, offers a "more" button only once the laid-out
 *          text runs past them, opens and closes from that button with its expanded state, and starts open when asked.
 * Boundary: React Native does not render in vitest, so it and the house Text are recording stand-ins that render plain
 *           DOM; the text layout is driven through the recorded `onTextLayout`.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.4.10 and 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { Truncate } from "#native/truncate/truncate";

const state = vi.hoisted(() => ({
  text: {} as Record<string, unknown>,
  button: undefined as Record<string, unknown> | undefined,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { className: props["className"] as string },
        props["children"] as ReactNode,
      ),
    Pressable: (props: Record<string, unknown>) => {
      state.button = props;
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      if (props["onTextLayout"]) state.text = props;
      return createElement("span", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText: () => (key: string) => key,
}));

const layOut = (count: number) =>
  act(() =>
    (state.text["onTextLayout"] as (event: unknown) => void)({
      nativeEvent: { lines: Array.from({ length: count }, () => ({})) },
    }),
  );

beforeEach(() => {
  state.text = {};
  state.button = undefined;
});

describe("Truncate (native)", () => {
  it("clamps to its lines and offers no button while the text fits", () => {
    render(<Truncate lines={2}>Short</Truncate>);
    expect(state.text["numberOfLines"]).toBe(2);
    layOut(2);
    expect(state.button).toBeUndefined();
  });

  it("offers more once the text runs past, then opens and closes", () => {
    render(<Truncate className="note">Long text</Truncate>);
    expect(state.text["numberOfLines"]).toBe(3);
    layOut(5);
    expect(state.button).toMatchObject({ accessibilityState: { expanded: false } });
    fireEvent.click(screen.getByText("ui::truncate.more"));
    expect(state.text["numberOfLines"]).toBeUndefined();
    expect(state.button).toMatchObject({ accessibilityState: { expanded: true } });
    fireEvent.click(screen.getByText("ui::truncate.less"));
    expect(state.text["numberOfLines"]).toBe(3);
  });

  it("starts open with a less button", () => {
    render(<Truncate defaultExpanded>Text</Truncate>);
    expect(screen.getByText("ui::truncate.less")).toBeTruthy();
  });
});
