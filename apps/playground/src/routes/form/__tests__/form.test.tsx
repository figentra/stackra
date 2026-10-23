/**
 * Stackra file contract:
 * Purpose: proves the form page titles the document, shows a label in each state tied to its control, a description
 *          that the control names, an error shown by `isInvalid` and a valid field with none, and a live form that
 *          refuses a bad email with its error, focus and status, sends a good one, and, with the switch on, sends on
 *          Control plus Enter and not on Enter alone.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @covers sta-350:FR-094
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Form } from "#src/routes/form/form";
import { FormRoute } from "#src/routes/form/form.route";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <Form />
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));
const status = () => screen.getByTestId("submit-state").textContent;
const email = () => screen.getByRole("textbox", { name: /^Email/ });

describe("Form page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /form under Forms", () => {
    renderPage();
    expect(FormRoute.path).toBe("/form");
    expect(FormRoute.category).toBe("Forms");
    expect(screen.getByRole("heading", { level: 1, name: "Form" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Form · Stackra Playground");
  });

  it("names each control by its label, in each of the four states", () => {
    renderPage();
    const labels = section("Label");
    for (const name of ["Default label", "Required label", "Invalid label", "Disabled label"])
      expect(labels.getByRole("textbox", { name })).toBeTruthy();
    expect(
      (labels.getByRole("textbox", { name: "Disabled label" }) as HTMLInputElement).disabled,
    ).toBe(true);
    expect(labels.getByText("Required label").classList.contains("label--required")).toBe(true);
    expect(labels.getByText("Invalid label").classList.contains("label--invalid")).toBe(true);
  });

  it("describes the control by its description", () => {
    renderPage();
    const field = section("Description").getByRole("textbox", { name: "Display name" });
    expect(field).toHaveProperty("id", "display-name");
    expect(field.getAttribute("aria-describedby")).toBe(
      section("Description").getByText("Shown on invoices. You can change it later.").id,
    );
  });

  it("shows the error of the invalid field and none for the valid one", () => {
    renderPage();
    const errors = section("Field error");
    expect(errors.getByText("Enter a value before you continue.").id).toBe("invalid-field-error");
    expect(errors.getAllByText("Enter a value before you continue.")).toHaveLength(1);
    expect(
      errors.getByRole("textbox", { name: "Invalid field" }).getAttribute("aria-invalid"),
    ).toBe("true");
  });

  it("refuses a bad email: the error shows, focus moves to the field and the status says so", () => {
    renderPage();
    fireEvent.change(email(), { target: { value: "nobody" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("Enter an email address, such as name@example.com.")).toBeTruthy();
    expect(document.activeElement).toBe(email());
    expect(email().getAttribute("aria-invalid")).toBe("true");
    expect(email().getAttribute("aria-describedby")).toBe("email-hint email-error");
    expect(status()).toBe("Not sent: the email is not valid.");
  });

  it("sends a good email and clears the error", () => {
    renderPage();
    fireEvent.change(email(), { target: { value: "nobody" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    fireEvent.change(email(), { target: { value: "ada@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(status()).toBe("Sent 1 time, to ada@example.com.");
    expect(screen.queryByText("Enter an email address, such as name@example.com.")).toBeNull();
  });

  it("with the switch on, sends on Control plus Enter and not on Enter alone", () => {
    renderPage();
    fireEvent.change(email(), { target: { value: "ada@example.com" } });
    fireEvent.keyDown(email(), { key: "Enter" });
    expect(status()).toBe("Nothing sent yet.");
    fireEvent.keyDown(email(), { key: "Enter", ctrlKey: true });
    expect(status()).toBe("Sent 1 time, to ada@example.com.");
  });
});
