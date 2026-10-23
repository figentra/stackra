/**
 * Stackra file contract:
 * Purpose: proves the EmojiPicker page sits at /pro-emoji-picker in the Pro group, titles the page and the document,
 *          shows the chosen emoji on a named button, keeps the grid closed until the button is pressed, and opens a
 *          grid of emoji.
 * Boundary: jsdom with real HeroUI Pro and React Aria; `matchMedia` and `ResizeObserver` are stubbed because jsdom has
 *          neither. The grid is virtualised, which jsdom cannot lay out, so only the open popover and the grid's
 *          presence are checked here; choosing an emoji is checked in the browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProEmojiPicker } from "#src/routes/pro-emoji-picker/pro-emoji-picker";
import { ProEmojiPickerRoute } from "#src/routes/pro-emoji-picker/pro-emoji-picker.route";

describe("ProEmojiPicker", () => {
  beforeEach(stubBrowserApis);
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-emoji-picker in the Pro group, and titles the page and the document", () => {
    render(<ProEmojiPicker />);
    expect(ProEmojiPickerRoute.path).toBe("/pro-emoji-picker");
    expect(ProEmojiPickerRoute.group).toBe("Pro");
    expect(screen.getByRole("heading", { level: 1, name: ProEmojiPickerRoute.title })).toBeTruthy();
    expect(document.title).toBe("EmojiPicker · Stackra Playground");
  });

  it("shows the chosen emoji on a named button, with the grid closed", () => {
    render(<ProEmojiPicker />);
    const trigger = screen.getByRole("button", { name: /Choose an emoji/ });
    expect(trigger.textContent).toContain("😀");
    expect(screen.getByRole("status").textContent).toBe("Chosen: 😀 grinning face");
    expect(screen.queryByRole("searchbox")).toBeNull();
  });

  it("opens a searchable grid of emoji from the button", () => {
    render(<ProEmojiPicker />);
    fireEvent.click(screen.getByRole("button", { name: /Choose an emoji/ }));
    expect(screen.getByRole("searchbox", { name: "Search emoji" })).toBeTruthy();
    expect(screen.getByRole("listbox")).toBeTruthy();
  });
});
