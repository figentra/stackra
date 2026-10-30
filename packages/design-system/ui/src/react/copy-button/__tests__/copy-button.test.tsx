/**
 * Stackra file contract:
 * Purpose: proves the web CopyButton writes its value to the clipboard, then turns its name and icon into "Copied"
 *          with a status announcement and back after two seconds, calls `onCopy`, stays put when the clipboard
 *          refuses, takes the caller's labels and passes the IconButton's props through.
 * Boundary: jsdom with real HeroUI; the clipboard is a stub and the timers are fake.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); design-system gap inventory row 35.
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { CopyButton } from "#react/copy-button/copy-button";

/** Lets the clipboard promise settle inside `act`. */
const settle = () => act(async () => {});

describe("CopyButton (web)", () => {
  let writeText: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies the value, says Copied, announces it and turns back after two seconds", async () => {
    vi.useFakeTimers();
    const onCopy = vi.fn();
    render(<CopyButton value="ORD-2048" onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await settle();
    expect(writeText).toHaveBeenCalledWith("ORD-2048");
    expect(onCopy).toHaveBeenCalledWith("ORD-2048");
    expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("Copied");
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("stays as it was when the clipboard refuses", async () => {
    writeText.mockImplementation(() => Promise.reject(new Error("denied")));
    const onCopy = vi.fn();
    render(<CopyButton value="x" onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await settle();
    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copy" })).toBeTruthy();
  });

  it("takes the caller's labels and passes the button's props through", async () => {
    render(
      <CopyButton
        value="sk_live"
        label="Copy API key"
        copiedLabel="API key copied"
        data-testid="mine"
        size="sm"
      />,
    );
    const button = screen.getByRole("button", { name: "Copy API key" });
    expect(button.getAttribute("data-testid")).toBe("mine");
    fireEvent.click(button);
    await settle();
    expect(screen.getByRole("button", { name: "API key copied" })).toBeTruthy();
  });
});
