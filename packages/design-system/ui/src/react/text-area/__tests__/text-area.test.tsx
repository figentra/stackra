/**
 * Stackra file contract:
 * Purpose: proves the web TextArea is a multi-line textbox named by its label with its description and error tied to
 *          it, shows the lines asked for, keeps the required, disabled and read-only states, reports each change as a
 *          string, takes the variant and the full-width default, passes unknown props through, and refuses `type`,
 *          `fullWidth` and `children`.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so classes and attributes are checked,
 *           not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-066 sta-350:FR-067
import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";

import type { TextAreaContractProps } from "#contracts/types/text-area-contract-props.type";
import { TextArea, type TextAreaProps } from "#react/text-area/text-area";

describe("TextArea (web)", () => {
  it("is a textarea named by its label, with the description tied to it", () => {
    const { container } = render(<TextArea label="Message" description="Be brief" />);
    const area = screen.getByRole("textbox", { name: "Message" });
    expect(area.tagName).toBe("TEXTAREA");
    expect(container.querySelector('[data-slot="textarea"]')).toBe(area);
    expect(area.getAttribute("aria-describedby")?.split(" ")).toContain(
      screen.getByText("Be brief").id,
    );
  });

  it("shows the error message only while the field is invalid", () => {
    const { rerender } = render(<TextArea label="Message" errorMessage="Too short" />);
    expect(screen.queryByText("Too short")).toBeNull();
    rerender(<TextArea label="Message" errorMessage="Too short" isInvalid />);
    const area = screen.getByRole("textbox", { name: "Message" });
    expect(area.getAttribute("aria-invalid")).toBe("true");
    expect(area.getAttribute("aria-describedby")?.split(" ")).toContain(
      screen.getByText("Too short").id,
    );
  });

  it("shows the lines asked for and the placeholder", () => {
    render(<TextArea aria-label="Notes" rows={6} placeholder="Write here" />);
    const area = screen.getByPlaceholderText("Write here") as HTMLTextAreaElement;
    expect(area.rows).toBe(6);
  });

  it("marks the field required, disabled and read-only", () => {
    const { rerender } = render(<TextArea label="Message" isRequired />);
    expect(screen.getByRole("textbox", { name: /Message/ }).hasAttribute("required")).toBe(true);
    rerender(<TextArea label="Message" isDisabled />);
    expect(screen.getByRole("textbox", { name: "Message" }).hasAttribute("disabled")).toBe(true);
    rerender(<TextArea label="Message" isReadOnly value="fixed" />);
    expect(screen.getByRole("textbox", { name: "Message" }).hasAttribute("readonly")).toBe(true);
  });

  it("keeps its own text when uncontrolled, reports each change as a string and submits under its name", () => {
    const onChange = vi.fn();
    const { container } = render(
      <form>
        <TextArea label="Message" name="message" defaultValue="Hi" onChange={onChange} />
      </form>,
    );
    const area = screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: "Hi there" } });
    expect(onChange).toHaveBeenCalledWith("Hi there");
    expect(area.value).toBe("Hi there");
    expect(new FormData(container.querySelector("form") as HTMLFormElement).get("message")).toBe(
      "Hi there",
    );
  });

  it("is a primary, full-width field by default and takes the secondary variant", () => {
    const { container, rerender } = render(<TextArea label="Message" />);
    expect(
      container
        .querySelector('[data-slot="textfield"]')
        ?.classList.contains("textfield--full-width"),
    ).toBe(true);
    expect(container.querySelector("textarea")?.className).toContain("textarea--primary");
    rerender(<TextArea label="Message" isFullWidth={false} variant="secondary" />);
    expect(
      container
        .querySelector('[data-slot="textfield"]')
        ?.classList.contains("textfield--full-width"),
    ).toBe(false);
    expect(container.querySelector("textarea")?.className).toContain("textarea--secondary");
  });

  it("passes unknown props through to HeroUI's root and keeps the caller's class", () => {
    const { container } = render(
      <TextArea label="Message" className="mine" maxLength={9} data-testid="root" />,
    );
    expect(screen.getByTestId("root").classList.contains("mine")).toBe(true);
    expect(container.querySelector("textarea")?.getAttribute("maxlength")).toBe("9");
  });

  it("matches the shared contract and refuses `type`, `fullWidth` and `children`", () => {
    expectTypeOf<TextAreaProps>().toExtend<TextAreaContractProps>();
    // @ts-expect-error an area has no kind of text
    createElement(TextArea, { type: "email" });
    // @ts-expect-error `fullWidth` is `isFullWidth` in the contract
    createElement(TextArea, { fullWidth: true });
    // @ts-expect-error the field draws its own parts
    const withChildren: TextAreaProps = { children: "x" };
    void withChildren;
  });
});
