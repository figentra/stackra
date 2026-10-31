/**
 * Stackra file contract:
 * Purpose: proves the web TamoStatusLine shows Stop while working, the message and Try again on error, and nothing idle.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoStatusLine } from "#react/tamo-status-line/tamo-status-line";

describe("TamoStatusLine (web)", () => {
  it("offers Stop while working and Try again on error", () => {
    const onStop = vi.fn();
    const onRetry = vi.fn();
    const { rerender } = render(
      <TamoStatusLine status="working" onStop={onStop} onRetry={onRetry} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
    rerender(<TamoStatusLine status="error" onStop={onStop} onRetry={onRetry} />);
    expect(screen.getByText("Tamo couldn't do that. Try again.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<TamoStatusLine status="idle" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
