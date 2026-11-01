/**
 * Stackra file contract:
 * Purpose: proves the web TamoDraftReview shows before and after, accepts the draft or its edit, discards, and shows the
 *          working and error states.
 * Boundary: jsdom with real HeroUI and React Aria; a stand-in slot answers the tasks, so no model runs.
 * Runtime: browser
 * Governing contract: ADR 0507; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TamoDraftReview } from "#react/tamo-draft-review/tamo-draft-review";

describe("TamoDraftReview (web)", () => {
  it("accepts the draft as edited, or discards it", () => {
    const onAccept = vi.fn();
    const onDiscard = vi.fn();
    render(
      <TamoDraftReview before="hi" after="Hello." onAccept={onAccept} onDiscard={onDiscard} />,
    );
    expect(screen.getByText("hi")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Hello there." } });
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalledWith("Hello there.");
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("offers Stop while working and Try again on error", () => {
    const { rerender } = render(
      <TamoDraftReview
        before="a"
        after=""
        status="working"
        onAccept={vi.fn()}
        onDiscard={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Stop" })).toBeTruthy();
    rerender(
      <TamoDraftReview
        before="a"
        after=""
        status="error"
        onAccept={vi.fn()}
        onDiscard={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
