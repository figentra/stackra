/**
 * Stackra file contract:
 * Purpose: proves the web MentionInput opens a listbox of matching people after `@`, moves through it with the arrow
 *          keys while focus stays in the box, writes `@Name ` on Enter, reports the mentioned ids, and closes on Escape.
 * Boundary: jsdom with real HeroUI; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); STA-1371 (wave C).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { MentionInput } from "#react/mention-input/mention-input";

const PEOPLE = [
  { id: "sara", name: "Sara Al-Harbi" },
  { id: "salem", name: "Salem Odeh" },
  { id: "noura", name: "Noura Faisal" },
] as const;

/** Types `text` with the caret at its end. */
const type = (box: HTMLTextAreaElement, text: string) => {
  fireEvent.change(box, { target: { value: text, selectionStart: text.length } });
};

describe("MentionInput (web)", () => {
  it("suggests people after @, moves with the arrows and writes the chosen name", () => {
    const onChange = vi.fn();
    const onMentionsChange = vi.fn();
    render(
      <MentionInput
        label="Note"
        people={PEOPLE}
        onChange={onChange}
        onMentionsChange={onMentionsChange}
      />,
    );
    const box = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Note" });
    type(box, "Thanks @sa");
    const list = screen.getByRole("listbox", { name: "People to mention" });
    expect(box.getAttribute("aria-controls")).toBe(list.id);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "SASara Al-Harbi",
      "SOSalem Odeh",
    ]);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box.getAttribute("aria-activedescendant")).toBe(`${list.id}-1`);
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("Thanks @Salem Odeh ");
    expect(onMentionsChange).toHaveBeenLastCalledWith(["salem"]);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes the list on Escape", () => {
    render(<MentionInput aria-label="Note" people={PEOPLE} />);
    const box = screen.getByRole<HTMLTextAreaElement>("textbox");
    type(box, "@n");
    expect(screen.getByRole("listbox")).toBeTruthy();
    fireEvent.keyDown(box, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
