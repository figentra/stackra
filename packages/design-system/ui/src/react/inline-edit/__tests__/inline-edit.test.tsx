/**
 * Stackra file contract:
 * Purpose: proves the web InlineEdit names its read value by the edit word and the label, opens an editor with the
 *          value and focus, saves on the button and on Enter (reporting only a change), cancels on the button and on
 *          Escape, keeps the editor open with the error `validate` gives, returns focus to the value, shows the
 *          placeholder while empty, follows a controlled value, refuses to open when read-only, and submits the value.
 * Boundary: jsdom with real HeroUI, React Aria and motion; looks are not checked.
 * Runtime: browser
 * Governing contract: gap inventory row 5; ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import type { InlineEditContractProps } from "#contracts/types/inline-edit-contract-props.type";
import { InlineEdit } from "#react/inline-edit/inline-edit";
import type { InlineEditProps } from "#react/inline-edit/inline-edit.props";

const WORDS = { editLabel: "Edit", saveLabel: "Save", cancelLabel: "Cancel" } as const;
const readValue = () => screen.getByRole("button", { name: /^Edit Store name/ });
const editor = () => screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement;

describe("InlineEdit (web)", () => {
  it("names the value by the edit word, the label and the value it shows", () => {
    render(<InlineEdit label="Store name" defaultValue="Olaya branch" {...WORDS} />);
    expect(screen.getByRole("button", { name: "Edit Store name Olaya branch" })).toBeTruthy();
  });

  it("opens an editor with the value and focus, and saves on the button", () => {
    const onChange = vi.fn();
    render(<InlineEdit label="Store name" defaultValue="Olaya" onChange={onChange} {...WORDS} />);
    act(() => readValue().click());
    expect(editor().value).toBe("Olaya");
    expect(document.activeElement).toBe(editor());
    fireEvent.change(editor(), { target: { value: "Olaya branch" } });
    act(() => screen.getByRole("button", { name: "Save" }).click());
    expect(onChange).toHaveBeenCalledWith("Olaya branch");
    expect(readValue().textContent).toContain("Olaya branch");
    expect(document.activeElement).toBe(readValue());
  });

  it("saves on Enter, reports only a change, and cancels on Escape", () => {
    const onChange = vi.fn();
    render(<InlineEdit label="Store name" defaultValue="A" onChange={onChange} {...WORDS} />);
    act(() => readValue().click());
    fireEvent.keyDown(editor(), { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    act(() => readValue().click());
    fireEvent.change(editor(), { target: { value: "B" } });
    fireEvent.keyDown(editor(), { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(readValue().textContent).toContain("A");
  });

  it("cancels on the button", () => {
    render(<InlineEdit label="Store name" defaultValue="A" {...WORDS} />);
    act(() => readValue().click());
    act(() => screen.getByRole("button", { name: "Cancel" }).click());
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("keeps the editor open with the error validate gives", () => {
    const onChange = vi.fn();
    render(
      <InlineEdit
        label="Store name"
        defaultValue="A"
        validate={(draft) => (draft.trim() === "" ? "Required" : undefined)}
        onChange={onChange}
        {...WORDS}
      />,
    );
    act(() => readValue().click());
    fireEvent.change(editor(), { target: { value: " " } });
    act(() => screen.getByRole("button", { name: "Save" }).click());
    expect(onChange).not.toHaveBeenCalled();
    expect(editor().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("shows the placeholder while empty and follows a controlled value", () => {
    const { rerender } = render(
      <InlineEdit label="Store name" value="" placeholder="Add a name" {...WORDS} />,
    );
    expect(readValue().textContent).toContain("Add a name");
    rerender(<InlineEdit label="Store name" value="Malqa" placeholder="Add a name" {...WORDS} />);
    expect(readValue().textContent).toContain("Malqa");
  });

  it("refuses to open when read-only, and submits the value under its name", () => {
    const { container } = render(
      <form>
        <InlineEdit label="Store name" name="store" defaultValue="A" isReadOnly {...WORDS} />
      </form>,
    );
    act(() => readValue().click());
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("store")).toBe("A");
  });

  it("matches the shared contract", () => {
    expectTypeOf<InlineEditProps>().toExtend<InlineEditContractProps>();
  });
});
