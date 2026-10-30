/**
 * Stackra file contract:
 * Purpose: proves the web ShareButton hands the link, title and text to the system share sheet and reports `shared`,
 *          reports nothing when the sheet is closed, and without a sheet says "Copy link", copies the link and says
 *          "Link copied" in its name and a status region.
 * Boundary: jsdom with real HeroUI; `navigator.share` and the clipboard are stubs.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ShareButton } from "#react/share-button/share-button";

/** Lets the share or clipboard promise settle inside `act`. */
const settle = () => act(async () => {});

const LINK = "https://shop.example/abaya";

describe("ShareButton (web)", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });

  it("opens the share sheet with the link and reports shared", async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const onShare = vi.fn();
    render(<ShareButton url={LINK} title="Linen abaya" text="Look at this" onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await settle();
    expect(share).toHaveBeenCalledWith({ url: LINK, title: "Linen abaya", text: "Look at this" });
    expect(onShare).toHaveBeenCalledWith("shared");
  });

  it("reports nothing when the sheet is closed", async () => {
    const abort = Object.assign(new Error("closed"), { name: "AbortError" });
    Object.defineProperty(navigator, "share", {
      value: vi.fn(() => Promise.reject(abort)),
      configurable: true,
    });
    const onShare = vi.fn();
    render(<ShareButton url={LINK} isIconOnly onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await settle();
    expect(onShare).not.toHaveBeenCalled();
  });

  it("copies the link where there is no share sheet", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const onShare = vi.fn();
    render(<ShareButton url={LINK} onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await settle();
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(onShare).toHaveBeenCalledWith("copied");
    expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Link copied");
  });
});
