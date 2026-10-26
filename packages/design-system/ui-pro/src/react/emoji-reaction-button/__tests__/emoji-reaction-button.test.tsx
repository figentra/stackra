/**
 * Stackra file contract:
 * Purpose: proves the web EmojiReactionButton names its button from `label`, maps `size`, toggles and reports
 *          through HeroUI Pro's own `onChange`, honours HeroUI Pro's `isReadOnly` and `isDisabled`, passes unknown
 *          props through, carries HeroUI Pro's own parts, and refuses HeroUI Pro's `aria-label` and a size outside
 *          sm, md and lg.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not
 *          looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import { EmojiReactionButton as HeroEmojiReactionButton } from "@heroui-pro/react/emoji-reaction-button";
import type { Size } from "@stackra/ui/contracts";
import { render, screen } from "@testing-library/react";

import { EmojiReactionButton } from "#react/emoji-reaction-button/emoji-reaction-button";
import type { EmojiReactionButtonProps } from "#react/emoji-reaction-button/emoji-reaction-button.props";

describe("EmojiReactionButton (web)", () => {
  it("names the button from label, shows emoji and count, and toggles", () => {
    const onChange = vi.fn();
    render(
      <EmojiReactionButton label="Thumbs up" onChange={onChange}>
        <EmojiReactionButton.Emoji>+1</EmojiReactionButton.Emoji>
        <EmojiReactionButton.Count>3</EmojiReactionButton.Count>
      </EmojiReactionButton>,
    );
    const button = screen.getByRole("button", { name: "Thumbs up" });
    expect(button.textContent).toContain("3");
    button.click();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("maps size, and keeps HeroUI Pro's default without one", () => {
    const { rerender } = render(
      <EmojiReactionButton label="x" size="lg">
        x
      </EmojiReactionButton>,
    );
    const button = screen.getByRole("button");
    expect(button.classList.contains("emoji-reaction-button--lg")).toBe(true);
    rerender(<EmojiReactionButton label="x">x</EmojiReactionButton>);
    expect(screen.getByRole("button").classList.contains("emoji-reaction-button--md")).toBe(true);
  });

  it("honours HeroUI Pro's own isReadOnly and isDisabled, and passes unknown props through", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <EmojiReactionButton label="x" isReadOnly onChange={onChange} data-testid="reaction">
        x
      </EmojiReactionButton>,
    );
    screen.getByTestId("reaction").click();
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <EmojiReactionButton label="x" isDisabled data-testid="reaction">
        x
      </EmojiReactionButton>,
    );
    expect((screen.getByTestId("reaction") as HTMLButtonElement).disabled).toBe(true);
  });

  it("carries HeroUI Pro's own parts", () => {
    expect(EmojiReactionButton.Emoji).toBe(HeroEmojiReactionButton.Emoji);
    expect(EmojiReactionButton.Count).toBe(HeroEmojiReactionButton.Count);
  });

  it("requires label, takes sm, md and lg, and refuses HeroUI Pro's aria-label name", () => {
    expectTypeOf<EmojiReactionButtonProps["label"]>().toEqualTypeOf<string>();
    expectTypeOf<EmojiReactionButtonProps["size"]>().toEqualTypeOf<Size | undefined>();
    expectTypeOf<EmojiReactionButtonProps>().not.toHaveProperty("aria-label");
  });
});
