/**
 * Stackra file contract:
 * Purpose: proves the web ReactionButton is a toggle named by the emoji and count that counts the user's 1 when uncontrolled, the YearPicker reports the year picked, and the EmojiPicker searches.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); WCAG 2.2 SC 2.1.1, 4.1.2; ADR 0022.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { EmojiPicker } from "#react/emoji-picker/emoji-picker";
import { ReactionButton } from "#react/reaction-button/reaction-button";
import { YearPicker } from "#react/year-picker/year-picker";

describe("small pickers (web)", () => {
  it("toggles a reaction", () => {
    const onChange = vi.fn();
    render(<ReactionButton emoji="👍" label="thumbs up" count={3} onChange={onChange} />);
    const button = screen.getByRole("button", { name: /thumbs up/ });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("counts the user's own reaction when uncontrolled", () => {
    const onChange = vi.fn();
    render(<ReactionButton emoji="❤️" label="heart" count={4} onChange={onChange} />);
    const button = screen.getByRole("button", { name: /heart/ });
    fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.textContent).toContain("5");
    expect(onChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(button);
    expect(button.textContent).toContain("4");
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("starts selected and removes the user's 1 on toggle off", () => {
    render(<ReactionButton emoji="🎉" label="party" count={10} defaultSelected />);
    const button = screen.getByRole("button", { name: /party/ });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(button);
    expect(button.textContent).toContain("9");
  });

  it("picks a year", () => {
    const onChange = vi.fn();
    render(<YearPicker label="Year" minYear={2024} maxYear={2026} onChange={onChange} />);
    fireEvent.click(screen.getByRole("option", { name: /2025/ }));
    expect(onChange).toHaveBeenCalledWith(2025);
  });

  it("finds emoji by word and picks one", () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "rocket" } });
    fireEvent.click(screen.getByRole("button", { name: /rocket/ }));
    expect(onSelect).toHaveBeenCalledWith("🚀");
  });
});
