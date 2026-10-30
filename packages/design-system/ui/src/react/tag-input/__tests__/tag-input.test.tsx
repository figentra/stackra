/**
 * Stackra file contract:
 * Purpose: proves the web TagInput adds a typed tag on Enter, splits a pasted list, says why a duplicate or a tag
 *          past the maximum is refused, removes the last tag with Backspace in the empty input, and submits one hidden
 *          input per tag.
 * Boundary: jsdom with the real HeroUI and React Aria components; English words from the catalogue.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TagInput } from "#react/tag-input/tag-input";

describe("TagInput (web)", () => {
  it("adds a typed tag on Enter and splits a pasted list", () => {
    const seen: (readonly string[])[] = [];
    render(<TagInput label="Customer tags" onChange={(tags) => seen.push(tags)} />);
    const box = screen.getByRole("textbox", { name: "Customer tags" });
    fireEvent.change(box, { target: { value: "VIP" } });
    fireEvent.keyDown(box, { key: "Enter" });
    fireEvent.paste(box, { clipboardData: { getData: () => "Riyadh, Jeddah\nDammam" } });
    expect(seen.at(-1)).toEqual(["VIP", "Riyadh", "Jeddah", "Dammam"]);
  });

  it("says why a duplicate or a tag past the maximum is refused", () => {
    render(<TagInput label="Tags" maxTags={2} defaultValue={["gold"]} />);
    const box = screen.getByRole("textbox", { name: "Tags" });
    fireEvent.change(box, { target: { value: "Gold" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(screen.getByText("“Gold” is already added.")).toBeTruthy();
    fireEvent.paste(box, { clipboardData: { getData: () => "silver, bronze" } });
    expect(screen.getByText("You can add up to 2 tags.")).toBeTruthy();
    expect(screen.getByText("2 of 2")).toBeTruthy();
  });

  it("removes the last tag with Backspace and submits each tag", () => {
    const { container } = render(<TagInput label="Tags" name="tags" defaultValue={["a", "b"]} />);
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Tags" }), { key: "Backspace" });
    const hidden = [...container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')];
    expect(hidden.map((input) => input.value)).toEqual(["a"]);
  });
});
