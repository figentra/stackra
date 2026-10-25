/**
 * Stackra file contract:
 * Purpose: proves the web `TextAreaField` takes a schema form's binding: it shows the bound value, reports the text the
 *          user types, shows the error while invalid, and keeps the TextArea's `rows` and `maxLength`.
 * Boundary: jsdom with real HeroUI and React Aria.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import { TextAreaField } from "#react/text-area-field/text-area-field";

describe("TextAreaField (web)", () => {
  it("takes the binding and the TextArea's own props", () => {
    const onChange = vi.fn();
    render(
      <TextAreaField
        name="message"
        label="Message"
        value="Hello"
        onChange={onChange}
        onBlur={vi.fn()}
        isInvalid
        errorMessage="too_short"
        rows={5}
        maxLength={2000}
      />,
    );
    const area = screen.getByRole("textbox", { name: "Message" }) as HTMLTextAreaElement;
    expect(area.value).toBe("Hello");
    expect(area.rows).toBe(5);
    expect(area.maxLength).toBe(2000);
    expect(screen.getByText("too_short")).toBeTruthy();
    fireEvent.change(area, { target: { value: "Hello there" } });
    expect(onChange).toHaveBeenCalledWith("Hello there");
  });
});
