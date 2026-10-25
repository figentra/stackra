/**
 * Stackra file contract:
 * Purpose: proves the web ModeSwitch is a switch named by its label, on in developer mode and off in normal mode,
 *          starting from `defaultMode` or held by `mode`, and reports the new mode on each change.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0359 (decisions 1 and 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { ModeSwitch } from "#react/mode-switch/mode-switch";

const control = () => screen.getByRole("switch", { name: "Developer mode" }) as HTMLInputElement;

describe("ModeSwitch (web)", () => {
  it("starts in normal mode, or in the default mode given", () => {
    const { unmount } = render(<ModeSwitch label="Developer mode" />);
    expect(control().checked).toBe(false);
    unmount();
    render(<ModeSwitch label="Developer mode" defaultMode="developer" />);
    expect(control().checked).toBe(true);
  });

  it("reports the new mode on each change", () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch label="Developer mode" onModeChange={onModeChange} />);
    fireEvent.click(control());
    expect(onModeChange).toHaveBeenLastCalledWith("developer");
    fireEvent.click(control());
    expect(onModeChange).toHaveBeenLastCalledWith("normal");
  });

  it("is held by mode when controlled", () => {
    const onModeChange = vi.fn();
    render(<ModeSwitch label="Developer mode" mode="normal" onModeChange={onModeChange} />);
    fireEvent.click(control());
    expect(onModeChange).toHaveBeenLastCalledWith("developer");
    expect(control().checked).toBe(false);
  });
});
