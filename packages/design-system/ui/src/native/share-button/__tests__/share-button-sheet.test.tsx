/**
 * Stackra file contract:
 * Purpose: proves the native ShareButton shares text alone without a link or title (no empty fields, no sheet title),
 *          swallows a failed share sheet without reporting it, and hands its button the caller's variant, size, class
 *          and disabled state.
 * Boundary: React Native's `Share` and the Button and IconButton are recording stand-ins.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { ShareButton } from "#native/share-button/share-button";

const state = vi.hoisted(() => ({
  shared: [] as unknown[][],
  isFailing: false,
  buttons: [] as Record<string, unknown>[],
  iconButtons: [] as Record<string, unknown>[],
}));

vi.mock("react-native", () => ({
  Share: {
    sharedAction: "sharedAction",
    share: (...args: unknown[]) => {
      state.shared.push(args);
      return state.isFailing
        ? Promise.reject(new Error("no share sheet"))
        : Promise.resolve({ action: "sharedAction" });
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

/** Presses the last drawn button and lets the sheet settle. */
const press = async (props: Record<string, unknown> | undefined): Promise<void> => {
  await act(async () => {
    ((props ?? {})["onPress"] as () => void)();
  });
};

describe("ShareButton sheet (native)", () => {
  beforeEach(() => {
    state.shared = [];
    state.isFailing = false;
    state.buttons = [];
    state.iconButtons = [];
  });

  it("shares text alone with no link, title or sheet title", async () => {
    const onShare = vi.fn();
    render(<ShareButton text="Eid offers" onShare={onShare} />);
    await press(state.buttons[0]);
    expect(state.shared[0]).toEqual([{ message: "Eid offers" }, {}]);
    expect(onShare).toHaveBeenCalledWith("shared");
  });

  it("swallows a failed sheet without reporting it", async () => {
    state.isFailing = true;
    const onShare = vi.fn();
    render(<ShareButton url="https://shop.example" isIconOnly onShare={onShare} />);
    await press(state.iconButtons[0]);
    expect(state.shared).toHaveLength(1);
    expect(onShare).not.toHaveBeenCalled();
  });

  it("hands the button the caller's look and state", () => {
    render(
      <>
        <ShareButton url="https://shop.example" variant="primary" size="lg" className="w-full" />
        <ShareButton url="https://shop.example" isIconOnly isDisabled size="sm" className="ms-2" />
      </>,
    );
    expect(state.buttons[0]).toMatchObject({
      startIcon: "share-2",
      variant: "primary",
      size: "lg",
      className: "w-full",
      isDisabled: false,
    });
    expect(state.iconButtons[0]).toMatchObject({
      variant: "ghost",
      size: "sm",
      className: "ms-2",
      isDisabled: true,
    });
  });
});
