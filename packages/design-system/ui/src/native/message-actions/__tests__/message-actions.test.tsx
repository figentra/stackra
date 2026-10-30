/**
 * Stackra file contract:
 * Purpose: proves the native MessageActions is a named toolbar that draws only the wired actions with their names,
 *          calls retry, and toggles the thumbs (pressing the pressed one clears it) or follows a controlled rating.
 * Boundary: React Native, the icon registry, CopyButton, IconButton, ToggleButton and Icon are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { MessageActions } from "#native/message-actions/message-actions";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  copies: [] as Record<string, unknown>[],
  icons: [] as Record<string, unknown>[],
  toggles: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
  };
});
vi.mock("@stackra/icons/native", () => ({
  IconRegistryProvider: ({ children }: { children: unknown }) => children,
}));
vi.mock("#native/message-actions/message-actions-icons.constant", () => ({
  MESSAGE_ACTIONS_ICONS: {},
}));
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/copy-button/copy-button", () => ({
  CopyButton: (props: Record<string, unknown>) => {
    state.copies.push(props);
    return null;
  },
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.icons.push(props);
    return null;
  },
}));
vi.mock("#native/toggle-button/toggle-button", () => ({
  ToggleButton: (props: Record<string, unknown>) => {
    state.toggles.push(props);
    return null;
  },
}));

/** The last-drawn thumb named `label`. */
const thumb = (label: string) =>
  [...state.toggles].reverse().find((props) => props["label"] === label) ?? {};

describe("MessageActions (native)", () => {
  beforeEach(() => {
    state.views = [];
    state.copies = [];
    state.icons = [];
    state.toggles = [];
  });

  it("draws only the wired actions in a named toolbar", () => {
    const onRetry = vi.fn();
    render(<MessageActions copyValue="Order 2048 ships today." onRetry={onRetry} />);
    expect(state.views[0]).toMatchObject({
      accessibilityRole: "toolbar",
      accessibilityLabel: "Message actions",
    });
    expect(state.copies[0]).toMatchObject({
      value: "Order 2048 ships today.",
      label: "Copy message",
    });
    expect(state.icons.map((props) => props["label"])).toEqual(["Retry"]);
    expect(state.toggles).toHaveLength(0);
    (state.icons[0]?.["onPress"] as () => void)?.();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("toggles the thumbs and clears a pressed one", () => {
    const onFeedbackChange = vi.fn();
    render(<MessageActions onFeedbackChange={onFeedbackChange} />);
    act(() => (thumb("Good response")["onChange"] as (on: boolean) => void)(true));
    expect(onFeedbackChange).toHaveBeenLastCalledWith("up");
    expect(thumb("Good response")["isSelected"]).toBe(true);
    act(() => (thumb("Good response")["onChange"] as (on: boolean) => void)(false));
    expect(onFeedbackChange).toHaveBeenLastCalledWith(null);
    expect(thumb("Good response")["isSelected"]).toBe(false);
  });

  it("follows a controlled rating", () => {
    render(<MessageActions feedback="down" onFeedbackChange={() => undefined} />);
    expect(thumb("Bad response")["isSelected"]).toBe(true);
    expect(thumb("Good response")["isSelected"]).toBe(false);
  });
});
