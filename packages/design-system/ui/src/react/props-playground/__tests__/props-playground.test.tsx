/**
 * Stackra file contract:
 * Purpose: proves the web PropsPlayground is a group named by the component, draws one named control per prop that
 *          drives the preview and reports every value, resets to the starting values, draws the preview alone in a
 *          chosen brand's tokens and in right-to-left without touching `<html>`, and keeps every control a native
 *          input the keyboard reaches.
 * Boundary: jsdom with real HeroUI; no theme CSS is loaded, so attributes and inline variables are checked.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060; ADR 0022 (test placement); STA-2041.
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { STACKRA_THEME } from "@stackra/tokens";

import type { PlaygroundControl } from "#contracts/types/playground-control.type";
import { PropsPlayground } from "#react/props-playground/props-playground";

const CONTROLS: readonly PlaygroundControl[] = [
  { name: "children", type: "string", default: "Save" },
  { name: "isDisabled", type: "boolean" },
];

/** The playground over a button that shows its values. */
function renderPlayground(onChange = vi.fn()) {
  render(
    <PropsPlayground
      label="Button"
      controls={CONTROLS}
      brands={[{ id: "pay", label: "Pay", theme: STACKRA_THEME }]}
      onChange={onChange}
      render={(values) => (
        <button type="button" disabled={values["isDisabled"] === true}>
          {String(values["children"])}
        </button>
      )}
    />,
  );
  return onChange;
}

describe("PropsPlayground (web)", () => {
  it("is a named group whose controls drive the preview", () => {
    const onChange = renderPlayground();
    expect(screen.getByRole("group", { name: "Button" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    const text = screen.getByRole("textbox", { name: /children/ });
    fireEvent.change(text, { target: { value: "Pay now" } });
    expect(screen.getByRole("button", { name: "Pay now" })).toBeTruthy();
    expect(onChange).toHaveBeenLastCalledWith({ children: "Pay now", isDisabled: false });
    const toggle = screen.getByRole("switch", { name: /isDisabled/ });
    expect(toggle.tabIndex).not.toBe(-1);
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Pay now" }).hasAttribute("disabled")).toBe(true);
  });

  it("resets to the starting values", () => {
    renderPlayground();
    fireEvent.change(screen.getByRole("textbox", { name: /children/ }), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("draws the preview alone in a brand and in right-to-left", () => {
    renderPlayground();
    const preview = screen.getByRole("region", { name: "Preview" });
    fireEvent.click(screen.getByRole("radio", { name: "Pay" }));
    fireEvent.click(screen.getByRole("radio", { name: "Right to left" }));
    expect(preview.getAttribute("data-brand")).toBe(STACKRA_THEME.name);
    expect(preview.getAttribute("style")).toContain("--");
    expect(preview.getAttribute("dir")).toBe("rtl");
    expect(document.documentElement.getAttribute("dir")).not.toBe("rtl");
    expect(document.documentElement.hasAttribute("data-brand")).toBe(false);
  });
});
