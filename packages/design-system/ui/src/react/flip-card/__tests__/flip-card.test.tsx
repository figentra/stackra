/**
 * Stackra file contract:
 * Purpose: proves the web FlipCard: a toggle button described by its flip hint that turns on click, Enter and Space,
 *          reports the new side, keeps the hidden face inert, follows `isFlipped` when controlled, mirrors the turn
 *          in RTL, turns on the other axis when vertical, and is a plain, inert-free block while disabled.
 * Boundary: jsdom; the turn is a CSS transform, so the transform string is checked, not the animation.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "react-aria-components";

import { FlipCard } from "#react/flip-card/flip-card";

const faces = () => {
  const front = screen.getByText("Front").parentElement as HTMLElement;
  const back = screen.getByText("Back").parentElement as HTMLElement;
  return { front, back };
};

describe("FlipCard (web)", () => {
  it("turns on click, Enter and Space and reports the side", () => {
    const onFlipChange = vi.fn();
    render(
      <FlipCard
        front={<p>Front</p>}
        back={<p>Back</p>}
        flipLabel="Flip to see more"
        onFlipChange={onFlipChange}
      />,
    );
    const card = screen.getByRole("button");
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(document.getElementById(card.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      "Flip to see more",
    );
    expect(faces().back.hasAttribute("inert")).toBe(true);
    fireEvent.click(card);
    expect(onFlipChange).toHaveBeenLastCalledWith(true);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(faces().front.hasAttribute("inert")).toBe(true);
    expect(faces().front.style.transform).toBe("perspective(1000px) rotateY(180deg)");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onFlipChange).toHaveBeenLastCalledWith(false);
    fireEvent.keyDown(card, { key: " " });
    expect(onFlipChange).toHaveBeenLastCalledWith(true);
    fireEvent.keyDown(card, { key: "a" });
    expect(onFlipChange).toHaveBeenCalledTimes(3);
  });

  it("follows isFlipped, turns vertically and mirrors in RTL", () => {
    const onFlipChange = vi.fn();
    render(
      <I18nProvider locale="ar-SA">
        <FlipCard
          front={<p>Front</p>}
          back={<p>Back</p>}
          flipLabel="Flip"
          axis="vertical"
          isFlipped
          onFlipChange={onFlipChange}
        />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onFlipChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("true");
    expect(faces().front.style.transform).toBe("perspective(1000px) rotateX(-180deg)");
  });

  it("is not a button while disabled", () => {
    render(
      <FlipCard
        front={<p>Front</p>}
        back={<p>Back</p>}
        flipLabel="Flip"
        isDisabled
        defaultFlipped
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(faces().back.hasAttribute("inert")).toBe(false);
  });
});
