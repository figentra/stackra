/**
 * Stackra file contract:
 * Purpose: proves the native CopyButton writes its value through expo-clipboard, renames itself "Copied", announces
 *          it, calls `onCopy` and turns back after two seconds, and is disabled where expo-clipboard is missing.
 * Boundary: React Native does not render in vitest, so the IconButton, Icon, Reanimated and the clipboard loader are
 *          recording stand-ins; what reaches the IconButton is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 35.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { CopyButton } from "#native/copy-button/copy-button";

const state = vi.hoisted(() => ({
  button: {} as Record<string, unknown>,
  announced: [] as string[],
  clipboard: null as null | { setStringAsync: (text: string) => Promise<boolean> },
}));

vi.mock("react-native", () => ({
  AccessibilityInfo: { announceForAccessibility: (text: string) => state.announced.push(text) },
}));
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const chain = { duration: () => chain, reduceMotion: () => chain };
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", null, props["children"] as never),
    },
    ZoomIn: chain,
    ReduceMotion: { System: "system" },
  };
});
vi.mock("#native/icon/icon", () => ({ Icon: () => null }));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.button = props;
    return null;
  },
}));
vi.mock("#native/copy-button/load-clipboard.function", () => ({
  loadClipboard: () => state.clipboard,
}));

describe("CopyButton (native)", () => {
  afterEach(() => {
    vi.useRealTimers();
    state.announced = [];
  });

  it("copies, renames itself, announces and turns back after two seconds", async () => {
    vi.useFakeTimers();
    const setStringAsync = vi.fn(() => Promise.resolve(true));
    state.clipboard = { setStringAsync };
    const onCopy = vi.fn();
    render(<CopyButton value="ORD-2048" onCopy={onCopy} />);
    expect(state.button["label"]).toBe("Copy");
    expect(state.button["isDisabled"]).toBe(false);
    expect(state.button["variant"]).toBe("ghost");
    await act(async () => {
      (state.button["onPress"] as () => void)();
    });
    expect(setStringAsync).toHaveBeenCalledWith("ORD-2048");
    expect(onCopy).toHaveBeenCalledWith("ORD-2048");
    expect(state.button["label"]).toBe("Copied");
    expect(state.announced).toEqual(["Copied"]);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(state.button["label"]).toBe("Copy");
  });

  it("is disabled without expo-clipboard", () => {
    state.clipboard = null;
    render(<CopyButton value="x" label="Copy SKU" />);
    expect(state.button["isDisabled"]).toBe(true);
    expect(state.button["label"]).toBe("Copy SKU");
  });
});
