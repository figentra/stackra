/**
 * Stackra file contract:
 * Purpose: proves the web ShareButton's copy path beyond the first copy: "Link copied" goes back to "Copy link" after a
 *          moment; a refused clipboard reports nothing and keeps "Copy link"; with only text it copies the text; and a
 *          share sheet that cannot take the data falls back to copying.
 * Boundary: jsdom with real HeroUI and fake timers; `navigator.share`, `navigator.canShare` and the clipboard are stubs.
 * Runtime: browser
 * Governing contract: WCAG 2.2 SC 4.1.3; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ShareButton } from "#react/share-button/share-button";

/** Lets the clipboard promise settle inside `act`. */
const settle = () => act(async () => {});

const LINK = "https://shop.example/abaya";

/** Puts a clipboard whose write does what `write` does. */
function clipboard(write: () => Promise<void>) {
  const writeText = vi.fn(write);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return writeText;
}

describe("ShareButton copy (web)", () => {
  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: undefined, configurable: true });
  });

  it("goes back to Copy link after a moment", async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    render(<ShareButton url={LINK} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await settle();
    expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy();
    act(() => vi.runAllTimers());
    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy();
  });

  it("reports nothing and keeps Copy link when the clipboard refuses", async () => {
    clipboard(() => Promise.reject(new Error("NotAllowedError")));
    const onShare = vi.fn();
    render(<ShareButton url={LINK} onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await settle();
    expect(onShare).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy();
  });

  it("copies the text when there is no link", async () => {
    const writeText = clipboard(() => Promise.resolve());
    render(<ShareButton text="Eid offer: 20% off" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await settle();
    expect(writeText).toHaveBeenCalledWith("Eid offer: 20% off");
  });

  it("copies when the share sheet cannot take the data", async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    Object.defineProperty(navigator, "canShare", { value: () => false, configurable: true });
    const writeText = clipboard(() => Promise.resolve());
    const onShare = vi.fn();
    render(<ShareButton url={LINK} onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await settle();
    expect(share).not.toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(onShare).toHaveBeenCalledWith("copied");
  });
});
