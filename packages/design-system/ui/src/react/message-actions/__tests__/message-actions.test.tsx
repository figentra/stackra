/**
 * Stackra file contract:
 * Purpose: proves the web MessageActions is a named toolbar that draws only the wired actions with their names, calls
 *          retry and edit, toggles the thumbs with their pressed state (pressing the pressed one clears it), follows a
 *          controlled rating, and moves focus with the arrow keys.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { MessageActions } from "#react/message-actions/message-actions";

const press = (element: HTMLElement) => act(() => element.click());

describe("MessageActions (web)", () => {
  it("draws only the wired actions in a named toolbar", () => {
    const onRetry = vi.fn();
    render(<MessageActions copyValue="Order 2048 ships today." onRetry={onRetry} />);
    const toolbar = screen.getByRole("toolbar", { name: "Message actions" });
    expect(
      within(toolbar)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Copy message", "Retry"]);
    press(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("toggles the thumbs and clears a pressed one", () => {
    const onFeedbackChange = vi.fn();
    render(<MessageActions onEdit={() => undefined} onFeedbackChange={onFeedbackChange} />);
    const good = screen.getByRole("button", { name: "Good response" });
    const bad = screen.getByRole("button", { name: "Bad response" });
    expect(good.getAttribute("aria-pressed")).toBe("false");
    press(good);
    expect(onFeedbackChange).toHaveBeenLastCalledWith("up");
    expect(good.getAttribute("aria-pressed")).toBe("true");
    press(bad);
    expect(onFeedbackChange).toHaveBeenLastCalledWith("down");
    expect(good.getAttribute("aria-pressed")).toBe("false");
    press(bad);
    expect(onFeedbackChange).toHaveBeenLastCalledWith(null);
    expect(bad.getAttribute("aria-pressed")).toBe("false");
  });

  it("follows a controlled rating", () => {
    render(<MessageActions feedback="down" onFeedbackChange={() => undefined} />);
    expect(screen.getByRole("button", { name: "Bad response" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("moves focus between its buttons with the arrow keys", () => {
    render(<MessageActions onRetry={() => undefined} onEdit={() => undefined} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    act(() => retry.focus());
    fireEvent.keyDown(retry, { key: "ArrowRight" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit" }));
  });
});
