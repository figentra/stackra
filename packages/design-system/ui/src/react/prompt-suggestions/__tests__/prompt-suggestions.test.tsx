/**
 * Stackra file contract:
 * Purpose: proves the web PromptSuggestions is a named list of buttons, one per suggestion with its title and line,
 *          that calls `onSelect` with the suggestion by pointer or keyboard, refuses while disabled, and scrolls
 *          sideways in the scroll layout.
 * Boundary: jsdom with real React Aria.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import type { PromptSuggestion } from "#contracts/types/prompt-suggestion.type";
import { PromptSuggestions } from "#react/prompt-suggestions/prompt-suggestions";

const SUGGESTIONS: readonly PromptSuggestion[] = [
  { id: "track", title: "Track my order", description: "See where order 2048 is now" },
  { id: "return", title: "Start a return", prompt: "I want to return my abaya" },
];

describe("PromptSuggestions (web)", () => {
  it("lists one button per suggestion and reports the one chosen", () => {
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />);
    const list = screen.getByRole("list", { name: "Suggested prompts" });
    expect(within(list).getAllByRole("button")).toHaveLength(2);
    act(() => screen.getByRole("button", { name: /Track my order/ }).click());
    expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[0]);
    const second = screen.getByRole("button", { name: "Start a return" });
    act(() => second.focus());
    fireEvent.keyDown(second, { key: "Enter" });
    fireEvent.keyUp(second, { key: "Enter" });
    expect(onSelect).toHaveBeenLastCalledWith(SUGGESTIONS[1]);
  });

  it("refuses while disabled and scrolls sideways in the scroll layout", () => {
    const onSelect = vi.fn();
    render(
      <PromptSuggestions
        suggestions={SUGGESTIONS}
        onSelect={onSelect}
        isDisabled
        layout="scroll"
      />,
    );
    act(() => screen.getByRole("button", { name: "Start a return" }).click());
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("list").className).toContain("overflow-x-auto");
  });
});
