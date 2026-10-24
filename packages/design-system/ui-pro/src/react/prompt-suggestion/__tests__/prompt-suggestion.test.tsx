/**
 * Stackra file contract:
 * Purpose: proves the web PromptSuggestion draws HeroUI Pro's header, items and card parts, presses an item once,
 *          passes `variant` and unknown props through, and carries HeroUI Pro's own parts.
 * Boundary: jsdom with real HeroUI Pro and React Aria; the theme CSS is not loaded, so classes are checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-002
import { PromptSuggestion as HeroPromptSuggestion } from "@heroui-pro/react/prompt-suggestion";
import { render, screen } from "@testing-library/react";

import { PromptSuggestion } from "#react/prompt-suggestion/prompt-suggestion";

describe("PromptSuggestion (web)", () => {
  it("draws the header and the items, presses an item once, and passes unknown props through", () => {
    const onPress = vi.fn();
    render(
      <PromptSuggestion data-testid="root" className="extra">
        <PromptSuggestion.Header>
          <PromptSuggestion.Title>What do you want to work on?</PromptSuggestion.Title>
          <PromptSuggestion.Description>Start from a suggestion.</PromptSuggestion.Description>
        </PromptSuggestion.Header>
        <PromptSuggestion.Items>
          <PromptSuggestion.Item onPress={onPress}>Plan a launch</PromptSuggestion.Item>
        </PromptSuggestion.Items>
      </PromptSuggestion>,
    );
    expect(screen.getByTestId("root").classList.contains("extra")).toBe(true);
    expect(screen.getByRole("heading", { name: "What do you want to work on?" })).toBeTruthy();
    screen.getByRole("button", { name: /Plan a launch/ }).click();
    expect(onPress).toHaveBeenCalledOnce();
  });

  it("passes variant to HeroUI Pro and draws the card parts", () => {
    const { rerender } = render(
      <PromptSuggestion variant="card" data-testid="root">
        <PromptSuggestion.Group label="At work" description="Planning">
          <PromptSuggestion.Items>
            <PromptSuggestion.Item>
              <PromptSuggestion.ItemTitle>Weekly update</PromptSuggestion.ItemTitle>
              <PromptSuggestion.ItemDescription>
                Turn notes into an update.
              </PromptSuggestion.ItemDescription>
              <PromptSuggestion.ItemFooter>
                <PromptSuggestion.ItemTags>tags</PromptSuggestion.ItemTags>
                <PromptSuggestion.ItemMeta>2 min</PromptSuggestion.ItemMeta>
              </PromptSuggestion.ItemFooter>
            </PromptSuggestion.Item>
          </PromptSuggestion.Items>
        </PromptSuggestion.Group>
      </PromptSuggestion>,
    );
    const card = screen.getByTestId("root").className;
    expect(screen.getByText("Weekly update")).toBeTruthy();
    expect(screen.getByText("2 min")).toBeTruthy();
    expect(screen.getByText("At work")).toBeTruthy();
    rerender(
      <PromptSuggestion data-testid="root">
        <PromptSuggestion.Items>
          <PromptSuggestion.Item>x</PromptSuggestion.Item>
        </PromptSuggestion.Items>
      </PromptSuggestion>,
    );
    expect(screen.getByTestId("root").className).not.toBe(card);
  });

  it("carries HeroUI Pro's own parts", () => {
    for (const part of [
      "Header",
      "Title",
      "Description",
      "Group",
      "Items",
      "Item",
      "ItemTitle",
      "ItemDescription",
      "ItemFooter",
      "ItemTags",
      "ItemMeta",
    ] as const) {
      expect(PromptSuggestion[part]).toBe(HeroPromptSuggestion[part]);
    }
  });
});
