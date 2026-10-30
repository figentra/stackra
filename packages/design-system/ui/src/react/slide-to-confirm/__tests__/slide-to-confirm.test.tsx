/**
 * Stackra file contract:
 * Purpose: proves the web SlideToConfirm confirms once from the keyboard, names itself by the confirmed words after,
 *          and refuses while disabled.
 * Boundary: renders the real component in jsdom (no layout, so the drag itself is left to the device pass).
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); wave 3c mobile interactions.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { SlideToConfirm } from "#react/slide-to-confirm/slide-to-confirm";

describe("SlideToConfirm (web)", () => {
  it("confirms once from the keyboard", () => {
    const onConfirm = vi.fn();
    render(
      <SlideToConfirm label="Slide to charge" confirmedLabel="Charged" onConfirm={onConfirm} />,
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Slide to charge" }), { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Charged" }), { key: " " });
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("refuses while disabled", () => {
    const onConfirm = vi.fn();
    render(<SlideToConfirm label="Slide" isDisabled onConfirm={onConfirm} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Slide" }), { key: "Enter" });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
