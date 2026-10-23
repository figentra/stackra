/**
 * Stackra file contract:
 * Purpose: proves the web FormSection is a `fieldset` named by its legend, ties its description to the group, draws
 *          only the parts it is given, keeps its fields inside the group, passes `disabled`, `className` and `id` to
 *          the fieldset (a disabled section disables the fields inside it), and refuses a missing title in its type.
 * Boundary: jsdom with real HeroUI and React Aria; the theme CSS is not loaded, so roles, attributes and classes are
 *           checked, not looks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-350:FR-060
import { render, screen } from "@testing-library/react";

import type { FormSectionContractProps } from "#contracts/types/form-section-contract-props.type";
import { FormSection, type FormSectionProps } from "#react/form-section/form-section";
import { TextField } from "#react/text-field/text-field";

describe("FormSection (web)", () => {
  it("is a group named by its title", () => {
    render(
      <FormSection title="Billing">
        <TextField label="Company" />
      </FormSection>,
    );
    const group = screen.getByRole("group", { name: "Billing" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group.querySelector("legend")?.textContent).toBe("Billing");
  });

  it("ties the description to the group", () => {
    render(<FormSection title="Billing" description="Where invoices go" />);
    const group = screen.getByRole("group", { name: "Billing" });
    const hint = screen.getByText("Where invoices go");
    expect(group.getAttribute("aria-describedby")).toBe(hint.id);
  });

  it("draws no description and names none when it has none", () => {
    render(<FormSection title="Billing" />);
    const group = screen.getByRole("group", { name: "Billing" });
    expect(group.hasAttribute("aria-describedby")).toBe(false);
    expect(group.querySelector('[data-slot="description"]')).toBeNull();
  });

  it("keeps its fields inside the group", () => {
    render(
      <FormSection title="Billing">
        <TextField label="Company" />
      </FormSection>,
    );
    const group = screen.getByRole("group", { name: "Billing" });
    expect(group.contains(screen.getByRole("textbox", { name: "Company" }))).toBe(true);
  });

  it("passes HeroUI's fieldset props through, and a disabled section disables its fields", () => {
    render(
      <FormSection title="Billing" disabled className="mine" id="billing">
        <TextField label="Company" />
      </FormSection>,
    );
    const group = screen.getByRole("group", { name: "Billing" });
    expect(group.id).toBe("billing");
    expect(group.classList.contains("mine")).toBe(true);
    expect(group.hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("textbox", { name: "Company" }).matches(":disabled")).toBe(true);
  });

  it("types: extends the contract, which needs a title", () => {
    expectTypeOf<FormSectionProps>().toExtend<FormSectionContractProps>();
    expectTypeOf<FormSectionProps["title"]>().not.toBeUndefined();
    // @ts-expect-error a section without a title names nothing
    render(<FormSection />);
  });
});
