/**
 * Stackra file contract:
 * Purpose: proves the native ShareButton opens React Native's share sheet with the text and link as the message, the
 *          link and the title, reports `shared` only when the sheet says so, and draws an icon-only button on request.
 * Boundary: React Native's `Share` and the Button and IconButton are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { ShareButton } from "#native/share-button/share-button";

const state = vi.hoisted(() => ({
  shared: [] as unknown[][],
  action: "sharedAction",
  buttons: [] as Record<string, unknown>[],
  iconButtons: [] as Record<string, unknown>[],
}));

vi.mock("react-native", () => ({
  Share: {
    sharedAction: "sharedAction",
    dismissedAction: "dismissedAction",
    share: (...args: unknown[]) => {
      state.shared.push(args);
      return Promise.resolve({ action: state.action });
    },
  },
}));
vi.mock("#native/button/button", () => ({
  Button: (props: Record<string, unknown>) => {
    state.buttons.push(props);
    return null;
  },
}));
vi.mock("#native/icon-button/icon-button", () => ({
  IconButton: (props: Record<string, unknown>) => {
    state.iconButtons.push(props);
    return null;
  },
}));

const LINK = "https://shop.example/abaya";

describe("ShareButton (native)", () => {
  beforeEach(() => {
    state.shared = [];
    state.buttons = [];
    state.iconButtons = [];
  });

  it("shares the text and link and reports shared", async () => {
    state.action = "sharedAction";
    const onShare = vi.fn();
    render(<ShareButton url={LINK} title="Linen abaya" text="Look at this" onShare={onShare} />);
    expect(state.buttons[0]?.["children"]).toBe("Share");
    await act(async () => {
      (state.buttons[0]?.["onPress"] as (() => void) | undefined)?.();
    });
    expect(state.shared[0]).toEqual([
      { message: `Look at this ${LINK}`, url: LINK, title: "Linen abaya" },
      { dialogTitle: "Linen abaya", subject: "Linen abaya" },
    ]);
    expect(onShare).toHaveBeenCalledWith("shared");
  });

  it("reports nothing when the sheet is dismissed, and draws an icon button on request", async () => {
    state.action = "dismissedAction";
    const onShare = vi.fn();
    render(<ShareButton url={LINK} isIconOnly label="Share product" onShare={onShare} />);
    expect(state.iconButtons[0]).toMatchObject({ icon: "share-2", label: "Share product" });
    await act(async () => {
      (state.iconButtons[0]?.["onPress"] as (() => void) | undefined)?.();
    });
    expect(onShare).not.toHaveBeenCalled();
  });
});
